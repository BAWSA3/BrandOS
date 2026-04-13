/**
 * Anonymous Checkout for Score Boost Audit ($19)
 *
 * No auth required — captures email at Stripe's hosted checkout page.
 * Handle is stored in session metadata so the success page can run
 * the audit against the right X account.
 *
 * Flow:
 *   POST /api/audit/checkout { handle }
 *     → creates Stripe Checkout Session (mode=payment)
 *     → returns session URL
 *   Stripe hosts checkout (user enters email + card)
 *     → on success, redirects to /audit/{session_id}
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { ONE_TIME_PRODUCTS } from '@/lib/plans';

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured' },
        { status: 503 }
      );
    }

    const { handle } = (await request.json()) as { handle?: string };

    if (!handle || typeof handle !== 'string') {
      return NextResponse.json({ error: 'Handle required' }, { status: 400 });
    }

    // Normalize handle — strip @, trim whitespace, lowercase for metadata key
    const cleanHandle = handle.replace(/^@/, '').trim();
    if (!cleanHandle || !/^[A-Za-z0-9_]{1,15}$/.test(cleanHandle)) {
      return NextResponse.json({ error: 'Invalid handle' }, { status: 400 });
    }

    const priceId = ONE_TIME_PRODUCTS.SCORE_BOOST_AUDIT.stripePriceId;
    if (!priceId) {
      console.error(
        '[audit/checkout] STRIPE_PRICE_SCORE_BOOST not configured'
      );
      return NextResponse.json(
        { error: 'Product not configured — admin action required' },
        { status: 503 }
      );
    }

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ||
      'https://mybrandos.app';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      // Collect email at Stripe's hosted page — required for delivery
      customer_creation: 'if_required',
      // Keep audit data on the session for the success page
      metadata: {
        productType: 'SCORE_BOOST_AUDIT',
        handle: cleanHandle,
      },
      payment_intent_data: {
        metadata: {
          productType: 'SCORE_BOOST_AUDIT',
          handle: cleanHandle,
        },
      },
      success_url: `${appUrl}/audit/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/?audit_canceled=1&handle=${encodeURIComponent(cleanHandle)}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[audit/checkout] Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    // Surface the real error in non-production so local debugging is easy
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json(
      {
        error: isDev
          ? `Failed to create checkout session: ${errMessage}`
          : 'Failed to create checkout session',
      },
      { status: 500 }
    );
  }
}
