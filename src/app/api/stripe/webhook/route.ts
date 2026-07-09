import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_WEBHOOK_SECRET } from '@/lib/stripe';
import prisma from '@/lib/db';
import type { SubscriptionTier, SubscriptionStatus } from '@prisma/client';
import Stripe from 'stripe';
import {
  claimWebhookEvent,
  releaseWebhookEvent,
  purgeOldWebhookClaims,
} from '@/lib/webhook-idempotency';
import { logSecurityEvent } from '@/lib/audit-log';
import { captureFunnelEvent } from '@/lib/funnel-events';

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
        await handleSubscriptionChange(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
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

async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const tier = (subscription.metadata?.tier || 'FREE') as SubscriptionTier;
  const status = mapStripeStatus(subscription.status);
  const firstItem = subscription.items.data[0];
  const interval = firstItem?.plan?.interval;
  const periodEnd = firstItem?.current_period_end;

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionTier: tier,
      subscriptionStatus: status,
      billingInterval: interval === 'year' ? 'annual' : 'monthly',
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: 'FREE',
      subscriptionStatus: 'CANCELED',
      stripeSubscriptionId: null,
      billingInterval: null,
      currentPeriodEnd: null,
    },
  });
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

  // Reset usage counters on successful payment (new billing period)
  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      subscriptionStatus: 'ACTIVE',
      checksUsedThisMonth: 0,
      generationsUsedThisMonth: 0,
      usageResetDate: new Date(),
    },
  });
}

function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  switch (status) {
    case 'active':
      return 'ACTIVE';
    case 'past_due':
      return 'PAST_DUE';
    case 'canceled':
      return 'CANCELED';
    case 'trialing':
      return 'TRIALING';
    case 'incomplete':
    case 'incomplete_expired':
      return 'INCOMPLETE';
    default:
      return 'ACTIVE';
  }
}
