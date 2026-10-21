import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import prisma from '@/lib/db';
import Stripe from 'stripe';
import {
  claimWebhookEvent,
  releaseWebhookEvent,
  purgeOldWebhookClaims,
} from '@/lib/webhook-idempotency';
import { logSecurityEvent } from '@/lib/audit-log';
import { captureFunnelEvent } from '@/lib/funnel-events';
import { syncSubscription, endSubscription } from '@/lib/billing-sync';
import { claimFoundingSpot } from '@/lib/founding';
import { sendTrialEndingEmail } from '@/lib/trial-email';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency: claim the event id BEFORE processing. A replayed or
  // concurrent duplicate delivery finds the claim taken and no-ops with 200
  // (200 so Stripe stops retrying — the first delivery owns the work).
  const claimed = await claimWebhookEvent(event.id, event.type);
  if (!claimed) {
    await logSecurityEvent({
      category: 'payment',
      eventType: 'webhook_replayed',
      metadata: { event_id: event.id },
    });
    return NextResponse.json({ received: true, replay: true });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(subscription);
        // turned off auto-renew (cancel during trial = never charged)
        const prev = (event.data as { previous_attributes?: Partial<Stripe.Subscription> })
          .previous_attributes;
        if (prev?.cancel_at_period_end === false && subscription.cancel_at_period_end) {
          await captureCancel(subscription);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await endSubscription(subscription);
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (userId && subscription.trial_end && !subscription.cancel_at_period_end) {
          await sendTrialEndingEmail(userId, new Date(subscription.trial_end * 1000));
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }
    }

    // 7-day retention, purged opportunistically (no cron needed)
    await purgeOldWebhookClaims().catch(() => {});

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Handler error:', error);
    // Release the claim so Stripe's retry can actually reprocess the event.
    await releaseWebhookEvent(event.id);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;

  // Anonymous audit purchase (no account) — attribute to the scanned handle,
  // matching the distinct id used at checkout_started.
  if (!userId) {
    const handle = session.metadata?.handle;
    if (handle) {
      await captureFunnelEvent(`anon:${handle.toLowerCase()}`, 'purchase_completed', {
        mode: session.mode,
        product_type: session.metadata?.productType ?? null,
        amount_cents: session.amount_total,
        anonymous: true,
      });
    }
    return;
  }

  if (session.mode === 'payment') {
    const productType = session.metadata?.productType;
    if (productType && session.payment_intent) {
      await prisma.purchase.create({
        data: {
          userId,
          type: productType,
          amount: session.amount_total || 0,
          currency: session.currency || 'usd',
          stripePaymentId:
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent.id,
          stripeSessionId: session.id,
          status: 'completed',
        },
      });
    }
  }

  const buyer = await prisma.user.findUnique({
    where: { id: userId },
    select: { supabaseId: true },
  });
  if (buyer) {
    await captureFunnelEvent(buyer.supabaseId, 'purchase_completed', {
      mode: session.mode,
      product_type: session.metadata?.productType ?? null,
      tier: session.metadata?.tier ?? null,
      amount_cents: session.amount_total,
    });
  }
}

async function captureCancel(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { supabaseId: true } });
  if (u) {
    await captureFunnelEvent(u.supabaseId, 'subscription_canceled', {
      tier: subscription.metadata?.tier ?? null,
      during_trial: subscription.status === 'trialing',
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: { subscriptionStatus: 'PAST_DUE' },
  });
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;
  // The $0 invoice at trial start is "paid" too. Only real money activates;
  // subscription events own the status otherwise.
  if (!invoice.amount_paid) return;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
    select: { id: true, supabaseId: true, subscriptionStatus: true },
  });
  if (!user) return;

  // Reset usage counters on a successful payment (new billing period)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      subscriptionStatus: 'ACTIVE',
      checksUsedThisMonth: 0,
      generationsUsedThisMonth: 0,
      usageResetDate: new Date(),
    },
  });

  // First real payment: a founding spot while they last
  const founding = await claimFoundingSpot(user.id);
  if (user.subscriptionStatus === 'TRIALING') {
    await captureFunnelEvent(user.supabaseId, 'trial_converted', {
      amount_cents: invoice.amount_paid,
      founding_number: founding,
    });
  }
}
