/**
 * Who gets an automatic re-read (docs/strategy/PRODUCT-MAP.md §4.2): active
 * members (a dashboard visit in the last 7 days, recorded by recordVisit)
 * whose latest read — manual or automatic — is at least REREAD_AFTER_DAYS
 * old. Pure, so `npm run test:moves` covers it; the cron loads the rows.
 */

export const REREAD_AFTER_DAYS = 3;
export const ACTIVE_WITHIN_DAYS = 7;
/** Reads per nightly run (cost cap; the rest wait for the next night). */
export const MAX_REREADS_PER_RUN = 40;

/**
 * Estimated cost of one read, for the run log (not billing):
 * SocialData ≈ 65 results (profile + ~60 recent posts + retries) × $0.0002,
 * plus the Claude Haiku read (~8K in / ~2K out tokens) ≈ $0.02–0.05.
 */
export const EST_COST_PER_READ_USD = 0.045;

const DAY_MS = 86_400_000;

export function rereadDue(
  m: { lastVisitAt: Date | null; lastReadAt: Date | null; hasX: boolean },
  now = new Date()
): boolean {
  if (!m.hasX || !m.lastVisitAt) return false;
  if (now.getTime() - m.lastVisitAt.getTime() > ACTIVE_WITHIN_DAYS * DAY_MS) return false;
  if (!m.lastReadAt) return true;
  return now.getTime() - m.lastReadAt.getTime() >= REREAD_AFTER_DAYS * DAY_MS;
}
