import type Stripe from 'stripe';
import prisma from '@/lib/db';
import type { SubscriptionTier } from '@prisma/client';
import { mapStripeStatus } from '@/lib/billing';
import { legacyTierToPlanTier } from '@/lib/plans';
import { captureFunnelEvent } from '@/lib/funnel-events';

/**
 * Write a Stripe subscription onto its user. Shared by the webhook and the
 * checkout return page (so a new trial unlocks the dashboard immediately, not
 * when the webhook lands). Idempotent: same subscription in, same row out.
 */
export async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  const tier = (subscription.metadata?.tier || 'PRO') as SubscriptionTier;
  const status = mapStripeStatus(subscription.status);
  const firstItem = subscription.items.data[0];
  const interval = firstItem?.plan?.interval;
  // during a trial this is the trial end (the first charge date)
  const periodEnd = subscription.trial_end ?? firstItem?.current_period_end;

  const before = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionStatus: true, stripeSubscriptionId: true, supabaseId: true },
  });
  if (!before) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionTier: tier,
      subscriptionStatus: status,
      billingInterval: interval === 'year' ? 'annual' : 'monthly',
      currentPeriodEnd:
        status === 'TRIALING' && subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : periodEnd
            ? new Date(periodEnd * 1000)
            : null,
    },
  });

  // Workspace plan drives assertCanScan + PlanLimit caps. PAST_DUE /
  // INCOMPLETE keep the current plan; deletion resets it.
  if (status === 'ACTIVE' || status === 'TRIALING') {
    await prisma.workspace.updateMany({
      where: { ownerUserId: userId, type: 'personal' },
      data: { plan: legacyTierToPlanTier(tier) },
    });
  }

  const isNew = before.stripeSubscriptionId !== subscription.id;
  if (isNew && status === 'TRIALING') {
    await captureFunnelEvent(before.supabaseId, 'trial_started', { tier });
  }
}

/** Subscription gone (cancelled during trial, or ended): back to Free. */
export async function endSubscription(subscription: Stripe.Subscription): Promise<void> {
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
  await prisma.workspace.updateMany({
    where: { ownerUserId: userId, type: 'personal' },
    data: { plan: legacyTierToPlanTier('FREE') },
  });
}
