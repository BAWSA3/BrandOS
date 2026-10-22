import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getUser } from '@/lib/auth';
import prisma from '@/lib/db';
import {
  PLAN_CONFIGS,
  ONE_TIME_PRODUCTS,
  OPEN_ACCESS_UNTIL,
  TRIAL_DAYS,
  type SubscriptionTier,
} from '@/lib/plans';
import { isOpenAccess, isSubscribed } from '@/lib/billing';
import { foundingSpotsLeft } from '@/lib/founding';
import { botGuard } from '@/lib/botid-guard';
import { captureFunnelEvent } from '@/lib/funnel-events';

export async function POST(request: NextRequest) {
  try {
    const botBlock = await botGuard(request);
    if (botBlock) return botBlock;

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'Billing is not open yet' }, { status: 503 });
    }

    const { tier, productType } = (await request.json().catch(() => ({}))) as {
      tier?: SubscriptionTier;
      productType?: string;
    };

    let customerId = user.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: {
          userId: user.id,
          xUsername: user.xUsername,
        },
      });
      customerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // One-time purchase (e.g., Brand DNA Report)
    if (productType) {
      const product = ONE_TIME_PRODUCTS[productType as keyof typeof ONE_TIME_PRODUCTS];
      if (!product) {
        return NextResponse.json({ error: 'Invalid product' }, { status: 400 });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        line_items: [
          {
            price: product.stripePriceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId: user.id,
          productType,
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?purchase=success&product=${productType}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      });

      await captureFunnelEvent(user.supabaseId, 'checkout_started', {
        mode: 'payment',
        product_type: productType,
      });

      return NextResponse.json({ url: session.url });
    }

    // Subscription checkout: Pro, monthly, card required. During the launch
    // window (open access until Dec 3) this is the Founding 100 card lock: no
    // charge until OPEN_ACCESS_UNTIL. After it: the 7-day card trial.
    // Annual plans, coupons and Agency/Enterprise are out of scope.
    if ((tier ?? 'PRO') !== 'PRO') {
      return NextResponse.json({ error: 'Invalid plan tier' }, { status: 400 });
    }
    // open access makes hasPro() true for everyone, so ask "did they pay"
    if (isSubscribed(user)) {
      return NextResponse.json(
        { error: 'You already have Pro', url: '/dashboard' },
        { status: 409 }
      );
    }
    // $29 while founding spots last; $39 (STRIPE_PRICE_PRO_STANDARD) after
    const founding = (await foundingSpotsLeft()) > 0;
    const priceId = founding
      ? PLAN_CONFIGS.PRO.stripePriceIdMonthly
      : process.env.STRIPE_PRICE_PRO_STANDARD || PLAN_CONFIGS.PRO.stripePriceIdMonthly;
    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 400 });
    }

    // One trial per customer: anyone who has ever had a subscription pays from day one.
    const prior = await stripe.subscriptions.list({
      customer: customerId,
      status: 'all',
      limit: 1,
    });
    const open = isOpenAccess();
    const trial = open || prior.data.length === 0;
    // Stripe wants trial_end >= 48h out; in the last two days, a 2-day trial
    // (charged at most ~2 days after Dec 3) instead
    const lockUntil = Math.floor(OPEN_ACCESS_UNTIL.getTime() / 1000);
    const trialTiming =
      open && lockUntil - Date.now() / 1000 > 49 * 3600
        ? { trial_end: lockUntil }
        : { trial_period_days: open ? 2 : TRIAL_DAYS };
    const app = process.env.NEXT_PUBLIC_APP_URL;
    const meta = { userId: user.id, tier: 'PRO', founding: founding ? '1' : '0' };

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      // the trial won't start without a card
      payment_method_collection: 'always',
      metadata: { ...meta, billingInterval: 'monthly' },
      subscription_data: {
        metadata: meta,
        ...(trial
          ? {
              ...trialTiming,
              // no card on file at trial end → cancel, never a free ride
              trial_settings: { end_behavior: { missing_payment_method: 'cancel' } },
            }
          : {}),
      },
      success_url: `${app}/dashboard?checkout={CHECKOUT_SESSION_ID}`,
      cancel_url: `${app}/pricing?canceled=true`,
    });

    await captureFunnelEvent(user.supabaseId, 'checkout_started', {
      mode: 'subscription',
      tier: 'PRO',
      trial,
      founding,
      open_access: open,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[Stripe Checkout] Error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
