/**
 * Daily fresh-scan limit (migration 054): the rules, pure so
 * `npm run test:scan-quota` covers them and the client can show the counter.
 * The table and the routes' checks live in scan-quota.ts.
 *
 * Decided with Bawsa 2026-10-29:
 * - only fresh reads count (anything that calls X); a stored read under 7
 *   days old or a cached score is free
 * - signed out: 1 a day per device, then sign in with X
 * - signed in, not paying (trial and code holders included): 3 a day
 * - paid ($29 Pro / Founding) and admins: unlimited
 * - the day is UTC; counts reset at midnight UTC
 * - the upgrade is the Founding offer
 */

export const SIGNED_OUT_SCANS_PER_DAY = 1;
export const FREE_SCANS_PER_DAY = 3;
export const UPGRADE_URL = '/pricing#founding';

export type ScanAllowance =
  | { unlimited: true }
  | { unlimited: false; signedIn: boolean; limit: number };

export function allowanceFor(input: {
  signedIn: boolean;
  admin: boolean;
  subscribed: boolean;
}): ScanAllowance {
  if (input.admin || input.subscribed) return { unlimited: true };
  return input.signedIn
    ? { unlimited: false, signedIn: true, limit: FREE_SCANS_PER_DAY }
    : { unlimited: false, signedIn: false, limit: SIGNED_OUT_SCANS_PER_DAY };
}

/** The UTC day as YYYY-MM-DD: one count per subject per day. */
export function utcDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Next midnight UTC, when the count resets. */
export function resetsAt(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1));
}

/** "6h" / "45m" until the reset, for the counter and the limit screen. */
export function resetsIn(now: Date): string {
  const mins = Math.max(1, Math.ceil((resetsAt(now).getTime() - now.getTime()) / 60_000));
  return mins >= 60 ? `${Math.ceil(mins / 60)}h` : `${mins}m`;
}

export interface QuotaView {
  unlimited: boolean;
  signedIn: boolean;
  limit: number;
  used: number;
  left: number;
  resetsAt: string;
}

export function quotaView(a: ScanAllowance, used: number, now: Date): QuotaView {
  if (a.unlimited)
    return {
      unlimited: true,
      signedIn: true,
      limit: 0,
      used: 0,
      left: 0,
      resetsAt: resetsAt(now).toISOString(),
    };
  const u = Math.max(0, used);
  return {
    unlimited: false,
    signedIn: a.signedIn,
    limit: a.limit,
    used: u,
    left: Math.max(0, a.limit - u),
    resetsAt: resetsAt(now).toISOString(),
  };
}

/** The line under the scan box. Null when there's nothing to say. */
export function counterLine(q: QuotaView): string | null {
  if (q.unlimited || !q.signedIn) return null;
  return q.left > 0 ? `${q.left} of ${q.limit} scans left today` : `No scans left today`;
}

/** What the limit says, signed in or out. */
export function limitCopy(
  q: Pick<QuotaView, 'signedIn' | 'limit'>,
  now: Date
): { title: string; body: string; cta: string; href: string } {
  if (!q.signedIn)
    return {
      title: "That's today's free read.",
      body: `Sign in with X to keep reading: ${FREE_SCANS_PER_DAY} a day free, unlimited on Pro.`,
      cta: 'Sign in with X',
      href: '/signup?next=/',
    };
  return {
    title: `That's your ${q.limit} reads for today.`,
    body: `More in ${resetsIn(now)}. Pro reads any account, any time: lock $29/month for life as one of the Founding 100.`,
    cta: 'See the Founding offer',
    href: UPGRADE_URL,
  };
}

/** The 429 body every limited route returns. */
export function limitBody(q: QuotaView, now: Date) {
  const c = limitCopy(q, now);
  return {
    error: `${c.title} ${c.body}`,
    code: 'SCAN_LIMIT' as const,
    signedIn: q.signedIn,
    limit: q.limit,
    resetsAt: q.resetsAt,
    upgradeUrl: c.href,
  };
}
