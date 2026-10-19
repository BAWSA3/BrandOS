import type { SubscriptionStatus } from '@prisma/client';
import { PAID_TIERS, type SubscriptionTier } from '@/lib/plans';

/**
 * Who gets Pro (the launch's one entitlement check). Pure: no DB, safe on
 * client and server.
 *
 *   Pro  = a paid tier AND (ACTIVE or TRIALING)
 *   Free = everything else: FREE, PAST_DUE (a failed charge, incl. the end of
 *          a trial), CANCELED, INCOMPLETE
 *   Admins (role "admin") always get Pro, so the founder isn't paywalled.
 */

export interface BillingFields {
  subscriptionTier: SubscriptionTier | string;
  subscriptionStatus: SubscriptionStatus | string;
  currentPeriodEnd?: Date | null;
  role?: string | null;
}

const ENTITLED: string[] = ['ACTIVE', 'TRIALING'];

export function hasPro(u: BillingFields): boolean {
  if (u.role === 'admin') return true;
  return (
    PAID_TIERS.includes(u.subscriptionTier as SubscriptionTier) &&
    ENTITLED.includes(u.subscriptionStatus)
  );
}

/** When the trial ends (Stripe's current period end during a trial), or null. */
export function trialEndsAt(u: BillingFields): Date | null {
  if (u.subscriptionStatus !== 'TRIALING' || !u.currentPeriodEnd) return null;
  return u.currentPeriodEnd;
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
