import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getUser } from '@/lib/auth';

export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.stripeCustomerId) {
      return NextResponse.json({ error: 'No billing account found' }, { status: 400 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/app`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[Stripe Portal] Error:', error);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
