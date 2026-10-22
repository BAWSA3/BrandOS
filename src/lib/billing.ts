import type { SubscriptionStatus } from '@prisma/client';
import { OPEN_ACCESS_UNTIL, PAID_TIERS, type SubscriptionTier } from '@/lib/plans';

/**
 * Who gets Pro (the launch's one entitlement check). Pure: no DB, safe on
 * client and server.
 *
 *   Pro  = a paid tier AND (ACTIVE or TRIALING)
 *   Free = everything else: FREE, PAST_DUE (a failed charge, incl. the end of
 *          a trial), CANCELED, INCOMPLETE
 *   Admins (role "admin") always get Pro, so the founder isn't paywalled.
 *   Until OPEN_ACCESS_UNTIL (Dec 3) everyone gets Pro: the launch offer.
 */

export interface BillingFields {
  subscriptionTier: SubscriptionTier | string;
  subscriptionStatus: SubscriptionStatus | string;
  currentPeriodEnd?: Date | null;
  role?: string | null;
}

const ENTITLED: string[] = ['ACTIVE', 'TRIALING'];

/** The launch window: everyone gets full access until OPEN_ACCESS_UNTIL. */
export function isOpenAccess(now: Date = new Date()): boolean {
  return now < OPEN_ACCESS_UNTIL;
}

/** Has a live paid subscription (founding cards count: TRIALING until the first charge). */
export function isSubscribed(u: BillingFields): boolean {
  return (
    PAID_TIERS.includes(u.subscriptionTier as SubscriptionTier) &&
    ENTITLED.includes(u.subscriptionStatus)
  );
}

/**
 * Pro access. Use isSubscribed() instead where the question is "did they
 * pay" (checkout guard, checkout-return sync), since open access makes this
 * true for everyone until Dec 3.
 */
export function hasPro(u: BillingFields, now: Date = new Date()): boolean {
  if (u.role === 'admin') return true;
  return isSubscribed(u) || isOpenAccess(now);
}

/** When the trial ends (Stripe's current period end during a trial), or null. */
export function trialEndsAt(u: BillingFields): Date | null {
  if (u.subscriptionStatus !== 'TRIALING' || !u.currentPeriodEnd) return null;
  return u.currentPeriodEnd;
}

/**
 * The date we store as currentPeriodEnd: the trial end while trialing (the
 * first charge date), otherwise the paid period's end (the renewal date).
 * Stripe keeps `trial_end` on the subscription after the trial is over, so it
 * must not win once the subscription is active.
 */
export function periodEndOf(sub: {
  status: string;
  trial_end?: number | null;
  items: { data: { current_period_end?: number | null }[] };
}): Date | null {
  const end =
    sub.status === 'trialing' && sub.trial_end
      ? sub.trial_end
      : (sub.items.data[0]?.current_period_end ?? null);
  return end ? new Date(end * 1000) : null;
}

/**
 * Stripe subscription status → ours. Anything that isn't a live subscription
 * maps to a non-entitled status: `unpaid` (dunning gave up) and `past_due`
 * (a failed charge, e.g. at trial end) are PAST_DUE; `paused` and unknown
 * statuses are INCOMPLETE. Never default to ACTIVE.
 */
export function mapStripeStatus(status: string): SubscriptionStatus {
  switch (status) {
    case 'active':
      return 'ACTIVE';
    case 'trialing':
      return 'TRIALING';
    case 'past_due':
    case 'unpaid':
      return 'PAST_DUE';
    case 'canceled':
      return 'CANCELED';
    default:
      return 'INCOMPLETE';
  }
}

/** 402 body for Pro-only API routes. */
export const PRO_REQUIRED = {
  error: 'BrandOS Pro required',
  upgradeUrl: '/pricing',
} as const;
