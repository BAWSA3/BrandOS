import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getUser } from '@/lib/auth';
import prisma from '@/lib/db';
import { PLAN_CONFIGS, SELF_SERVE_TIERS, ONE_TIME_PRODUCTS, type SubscriptionTier } from '@/lib/plans';

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier, interval, productType } = await request.json() as {
      tier?: SubscriptionTier;
      interval?: 'monthly' | 'annual';
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
        line_items: [{
          price: product.stripePriceId,
          quantity: 1,
        }],
        metadata: {
          userId: user.id,
          productType,
        },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?purchase=success&product=${productType}`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
      });

      return NextResponse.json({ url: session.url });
    }

    // Subscription checkout
    if (!tier || !SELF_SERVE_TIERS.includes(tier)) {
      return NextResponse.json({ error: 'Invalid plan tier' }, { status: 400 });
    }

    const plan = PLAN_CONFIGS[tier];
    const billingInterval = interval || 'monthly';
    const priceId = billingInterval === 'annual'
      ? plan.stripePriceIdAnnual
      : plan.stripePriceIdMonthly;

    if (!priceId) {
      return NextResponse.json({ error: 'Price not configured' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      metadata: {
        userId: user.id,
        tier,
        billingInterval,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
          tier,
        },
      },
      allow_promotion_codes: true,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?upgrade=success&plan=${tier}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?canceled=true`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[Stripe Checkout] Error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
