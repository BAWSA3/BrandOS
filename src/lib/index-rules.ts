/**
 * The BrandOS Creator Index: rules, labels and validation. Pure (no DB, no
 * network), so pages, routes and tests share one definition. The data side
 * lives in src/lib/creator-index.ts (server only).
 *
 * docs/GTM-OPERATING-PLAN.md: opt-in account holders only, free to be
 * listed, Pro to stand out. Off until Nov 2: everything 404s unless
 * INDEX_ENABLED is exactly "true" (admins can always preview it).
 */

export const indexEnabled = () => process.env.INDEX_ENABLED === 'true';

/** Can this viewer see the Index (pages, CTAs, join)? */
export const indexOpenFor = (viewer: { role?: string | null } | null | undefined) =>
  indexEnabled() || viewer?.role === 'admin';

/** The niches a member can pick (up to MAX_NICHES). Keep in sync with the join form. */
export const NICHES = [
  'DeFi',
  'Trading',
  'Memecoins',
  'NFTs & art',
  'Infra & dev',
  'AI',
  'Gaming',
  'Founder',
  'Research',
  'Education',
  'Community',
  'Culture & memes',
] as const;
export type Niche = (typeof NICHES)[number];

export const MAX_NICHES = 3;
export const BLURB_MAX = 140;
/** A brand read older than this is refreshed before joining (if the account can rescan). */
export const FRESH_READ_DAYS = 7;
export const PAGE_SIZE = 24;
export const FEATURED_MAX = 12;

const NICHE_SET = new Set<string>(NICHES);

export type JoinInput = { niches: Niche[]; blurb: string };

/**
 * Validate what a member typed. Niches must come from the list (deduped, at
 * most 3, at least 1); the blurb is one line, trimmed, control characters and
 * line breaks removed, at most 140 characters.
 */
export function parseJoin(
  raw: unknown
): { ok: true; value: JoinInput } | { ok: false; error: string } {
  const body = (raw && typeof raw === 'object' ? raw : {}) as { niches?: unknown; blurb?: unknown };
  const list = Array.isArray(body.niches) ? body.niches : [];
  const niches = [
    ...new Set(list.filter((n): n is Niche => typeof n === 'string' && NICHE_SET.has(n))),
  ];
  if (list.length > MAX_NICHES || niches.length > MAX_NICHES)
    return { ok: false, error: `Pick up to ${MAX_NICHES} niches.` };
  if (niches.length !== list.length) return { ok: false, error: 'Pick niches from the list.' };
  if (niches.length === 0) return { ok: false, error: 'Pick at least one niche.' };
  const blurb = cleanBlurb(body.blurb);
  if (!blurb) return { ok: false, error: 'Write one line for brands.' };
  if (blurb.length > BLURB_MAX)
    return { ok: false, error: `Keep it under ${BLURB_MAX} characters.` };
  return { ok: true, value: { niches, blurb } };
}

/** One line of plain text, or null when it's not a string. */
export function cleanBlurb(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  return raw
    .replace(/[\u0000-\u001f\u007f\u2028\u2029]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** "No. 0042". */
export const formatNumber = (n: number) => `No. ${String(n).padStart(4, '0')}`;

/** The UTC day a view counts for (one view per viewer per member per day). */
export const viewDay = (at: Date) => at.toISOString().slice(0, 10);

/** Who stands out in the Index: paying members (founding cards included) and admins. */
export interface StandoutFields {
  role?: string | null;
  subscriptionTier: string;
  subscriptionStatus: string;
}
const PAID = ['PRO', 'AGENCY', 'ENTERPRISE'];
const LIVE = ['ACTIVE', 'TRIALING'];
/**
 * Featured placement, the full profile and "who viewed you" follow a real card,
 * not hasPro(): open access makes everyone Pro until Dec 3, and the point of
 * standing out is the reason to add one.
 */
export const standsOut = (u: StandoutFields) =>
  u.role === 'admin' || (PAID.includes(u.subscriptionTier) && LIVE.includes(u.subscriptionStatus));

/** Filters from the URL (/index?niche=AI&archetype=…&min=60&max=90&page=2), validated. */
export interface IndexFilters {
  niche: Niche | null;
  archetype: string | null;
  min: number;
  max: number;
  page: number;
}
export function parseFilters(sp: Record<string, string | string[] | undefined>): IndexFilters {
  const one = (k: string) => {
    const v = sp[k];
    return typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined;
  };
  const int = (v: string | undefined, d: number, lo: number, hi: number) => {
    const n = Number.parseInt(v ?? '', 10);
    return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
  };
  const niche = one('niche');
  const archetype = one('archetype');
  const min = int(one('min'), 0, 0, 100);
  const max = int(one('max'), 100, 0, 100);
  return {
    niche: niche && NICHE_SET.has(niche) ? (niche as Niche) : null,
    archetype: archetype && /^[A-Za-z0-9 ._'-]{1,40}$/.test(archetype) ? archetype : null,
    min: Math.min(min, max),
    max: Math.max(min, max),
    page: int(one('page'), 1, 1, 500),
  };
}
