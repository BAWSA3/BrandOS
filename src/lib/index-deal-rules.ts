/**
 * Past brand deals on a Creator Index entry (migration 046): rules and
 * validation. Pure (no DB, no network), so the route, the form and tests share
 * one definition. The data side lives in src/lib/index-deals.ts (server only).
 *
 * docs/GTM-OPERATING-PLAN.md #5: the track record starts at join. A member
 * logs deals themselves; they stay private until the brand confirms them.
 */

import { cleanBlurb } from '@/lib/index-rules';

export const MAX_DEALS = 10;
export const BRAND_MAX = 60;
/** The earliest month a deal can be logged for ("YYYY-MM"). */
export const FIRST_MONTH = '2015-01';

export type DealInput = {
  brand: string;
  brandHandle: string | null;
  /** "YYYY-MM" */
  month: string | null;
  postUrl: string | null;
};

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;
const HANDLE_RE = /^[a-z0-9_]{1,15}$/;
const POST_RE =
  /^https:\/\/(?:www\.|mobile\.)?(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})\/status\/(\d{1,25})(?:[/?#].*)?$/;

/** "YYYY-MM" for a date, in UTC. */
export const monthOf = (at: Date) => at.toISOString().slice(0, 7);

/** An X handle typed with or without @, lowercased; null when empty, false when invalid. */
export function cleanHandle(raw: unknown): string | null | false {
  if (raw == null) return null;
  if (typeof raw !== 'string') return false;
  const h = raw.trim().replace(/^@/, '').toLowerCase();
  if (!h) return null;
  return HANDLE_RE.test(h) ? h : false;
}

/**
 * An X post link as https://x.com/<user>/status/<id> (twitter.com, www./mobile.
 * and any query or trailing path dropped); null when empty, false otherwise.
 * Only X post links are kept, so nothing else can be planted on a profile.
 */
export function cleanPostUrl(raw: unknown): string | null | false {
  if (raw == null) return null;
  if (typeof raw !== 'string') return false;
  const u = raw.trim();
  if (!u) return null;
  const m = POST_RE.exec(u);
  return m ? `https://x.com/${m[1]}/status/${m[2]}` : false;
}

/**
 * Validate one deal a member typed. The brand name is required (one line,
 * ≤60); the brand's X handle, the month (not before 2015-01, not in the
 * future) and the post link are optional.
 */
export function parseDeal(
  raw: unknown,
  now = new Date()
): { ok: true; value: DealInput } | { ok: false; error: string } {
  const body = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;

  const brand = cleanBlurb(body.brand);
  if (!brand) return { ok: false, error: 'Name the brand.' };
  if (brand.length > BRAND_MAX)
    return { ok: false, error: `Keep the brand name under ${BRAND_MAX} characters.` };

  const brandHandle = cleanHandle(body.brandHandle);
  if (brandHandle === false) return { ok: false, error: "That isn't an X handle." };

  let month: string | null = null;
  if (body.month != null && body.month !== '') {
    if (typeof body.month !== 'string' || !MONTH_RE.test(body.month))
      return { ok: false, error: 'Pick the month it ran.' };
    if (body.month < FIRST_MONTH || body.month > monthOf(now))
      return { ok: false, error: "That month can't be right." };
    month = body.month;
  }

  const postUrl = cleanPostUrl(body.postUrl);
  if (postUrl === false) return { ok: false, error: 'Paste a link to the post on X.' };

  return { ok: true, value: { brand, brandHandle, month, postUrl } };
}

/** What the API returns for a deal. */
export type DealView = {
  id: string;
  brand: string;
  brandHandle: string | null;
  month: string | null;
  postUrl: string | null;
  confirmed: boolean;
};
