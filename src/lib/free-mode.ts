/**
 * BrandOS is free (decided with Bawsa 2026-11-03): no plans, no upgrade, no
 * Founding offer. Every signed-in account gets Pro; nothing is sold.
 *
 * On by default so no env change is needed. NEXT_PUBLIC_FREE_FOR_EVERYONE=false
 * brings the paid model back (public, so client and server agree). Stripe code
 * and webhooks stay in place for anyone already subscribed.
 *
 * The daily fresh-scan limit still applies (reads cost real API calls):
 * 1 a day signed out, 3 a day signed in. See scan-quota-rules.ts.
 */
export function freeFrom(value: string | undefined): boolean {
  return (value ?? '').trim().toLowerCase() !== 'false';
}
export const FREE_FOR_EVERYONE = freeFrom(process.env.NEXT_PUBLIC_FREE_FOR_EVERYONE);
