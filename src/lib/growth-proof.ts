/**
 * The member's growth line (docs/strategy/PRODUCT-MAP.md §4.0):
 * "Since you joined: +412 followers, reach up 38%, 9 posts scored 80+."
 * Pure. Honest rules: it states the change since the member joined, never
 * that BrandOS caused it, and stays hidden until there is a week of daily
 * snapshots to compare (X doesn't share follower history before we started
 * tracking).
 */

export interface ProofSnapshot {
  day: Date;
  followers: number;
  avgViews: number;
}

export interface GrowthProof {
  /** ISO date tracking started (the baseline), for "since …". */
  since: string;
  days: number;
  followers: number;
  /** % change in average views per post; null when either side is unknown. */
  reachPct: number | null;
  /** Posts scored 80+ (on-brand) since joining. */
  onBrandPosts: number;
}

export const MIN_PROOF_DAYS = 7;
const DAY_MS = 86_400_000;

export function growthProof(
  joinedAt: Date,
  snapshots: ProofSnapshot[],
  onBrandPosts: number
): GrowthProof | null {
  const after = snapshots
    .filter((s) => s.day.getTime() >= joinedAt.getTime() - DAY_MS)
    .sort((a, b) => a.day.getTime() - b.day.getTime());
  if (after.length < 2) return null;
  const first = after[0];
  const last = after[after.length - 1];
  const days = Math.round((last.day.getTime() - first.day.getTime()) / DAY_MS);
  if (days < MIN_PROOF_DAYS) return null;
  const reachPct =
    first.avgViews > 0 && last.avgViews > 0
      ? Math.round(((last.avgViews - first.avgViews) / first.avgViews) * 100)
      : null;
  return {
    since: first.day.toISOString().slice(0, 10),
    days,
    followers: last.followers - first.followers,
    reachPct,
    onBrandPosts,
  };
}

/** "+412 followers · reach up 38% · 9 posts scored 80+" (parts with no data left out). */
export function proofParts(p: GrowthProof): string[] {
  const parts = [`${p.followers >= 0 ? '+' : ''}${p.followers.toLocaleString('en-US')} followers`];
  if (p.reachPct !== null)
    parts.push(
      p.reachPct === 0
        ? 'reach steady'
        : `reach ${p.reachPct > 0 ? 'up' : 'down'} ${Math.abs(p.reachPct)}%`
    );
  if (p.onBrandPosts > 0)
    parts.push(`${p.onBrandPosts} post${p.onBrandPosts === 1 ? '' : 's'} scored 80+`);
  return parts;
}
