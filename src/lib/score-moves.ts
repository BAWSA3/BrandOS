/**
 * "Why my score moved" (docs/strategy/PRODUCT-MAP.md §4.2). Compares the
 * member's two latest reads and points each phase's change at the posts
 * (and measured signals) behind it. Pure: no DB, no network — the dashboard
 * passes reads (BrandScan) and posts scored overnight (PostScore);
 * `npm run test:moves` covers it.
 *
 * Attribution, per phase:
 * - Generate / Scale move with reach: posts well above (≥1.3×) or below
 *   (≤0.7×) the member's usual likes (PostScore.multiple).
 * - Define / Check move with fit: on-brand posts (fit ≥ 80) or off-brand
 *   ones (fit < 60).
 * Only posts between the two reads count (or the 7 days before the latest
 * read when none were scored in that window). A phase with no matching post
 * says so plainly rather than guessing.
 */

export const PHASES = ['define', 'check', 'generate', 'scale'] as const;
export type MovePhase = (typeof PHASES)[number];

export interface ReadPoint {
  id: string;
  at: Date;
  score: number;
  phases: Record<MovePhase, number> | null;
}

export interface PostPoint {
  tweetId: string;
  postedAt: Date;
  fit: number;
  /** Likes ÷ the member's usual likes (null when unknown). */
  multiple: number | null;
  excerpt: string;
}

export interface MovePost {
  tweetId: string;
  excerpt: string;
  reason: string;
}

export interface PhaseMove {
  phase: MovePhase;
  delta: number;
  posts: MovePost[];
  /** A measured signal when no post explains the move (e.g. follower change). */
  note: string | null;
}

export interface ScoreMove {
  from: number;
  to: number;
  delta: number;
  /** ISO time of the previous read. */
  since: string;
  phases: PhaseMove[];
}

const UP_REACH = 1.3;
const DOWN_REACH = 0.7;
const ON_BRAND = 80;
const OFF_BRAND = 60;
const DAY_MS = 86_400_000;
const PER_PHASE = 2;

const fmtMultiple = (m: number) => (m >= 10 ? Math.round(m) : Math.round(m * 10) / 10);

function postsFor(phase: MovePhase, up: boolean, posts: PostPoint[]): MovePost[] {
  if (phase === 'generate' || phase === 'scale') {
    const pick = posts
      .filter(
        (p) => p.multiple !== null && (up ? p.multiple >= UP_REACH : p.multiple <= DOWN_REACH)
      )
      .sort((a, b) => (up ? b.multiple! - a.multiple! : a.multiple! - b.multiple!));
    return pick.slice(0, PER_PHASE).map((p) => ({
      tweetId: p.tweetId,
      excerpt: p.excerpt,
      reason: `${fmtMultiple(p.multiple!)}× your usual likes`,
    }));
  }
  const pick = posts
    .filter((p) => (up ? p.fit >= ON_BRAND : p.fit < OFF_BRAND))
    .sort((a, b) => (up ? b.fit - a.fit : a.fit - b.fit));
  return pick.slice(0, PER_PHASE).map((p) => ({
    tweetId: p.tweetId,
    excerpt: p.excerpt,
    reason: up ? `on-brand, fit ${p.fit}` : `off-brand, fit ${p.fit}`,
  }));
}

/**
 * The change between the two latest reads (oldest-first list), or null with
 * fewer than two reads or no phase data on either.
 */
export function explainMove(
  reads: ReadPoint[],
  posts: PostPoint[],
  signals: { followersDelta?: number | null } = {}
): ScoreMove | null {
  if (reads.length < 2) return null;
  const sorted = [...reads].sort((a, b) => a.at.getTime() - b.at.getTime());
  const curr = sorted[sorted.length - 1];
  const prev = sorted[sorted.length - 2];
  const between = posts.filter((p) => p.postedAt > prev.at && p.postedAt <= curr.at);
  const window = between.length
    ? between
    : posts.filter(
        (p) => p.postedAt <= curr.at && p.postedAt.getTime() > curr.at.getTime() - 7 * DAY_MS
      );

  const phases: PhaseMove[] = [];
  if (prev.phases && curr.phases) {
    for (const phase of PHASES) {
      const delta = Math.round(curr.phases[phase] - prev.phases[phase]);
      if (Math.abs(delta) < 1) continue;
      const moved = postsFor(phase, delta > 0, window);
      let note: string | null = null;
      if (!moved.length) {
        const f = signals.followersDelta;
        note =
          phase === 'scale' && typeof f === 'number' && f !== 0
            ? `${f > 0 ? '+' : ''}${f.toLocaleString('en-US')} followers since the last read`
            : 'From the overall read; no single post stands out.';
      }
      phases.push({ phase, delta, posts: moved, note });
    }
    phases.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  }

  return {
    from: prev.score,
    to: curr.score,
    delta: curr.score - prev.score,
    since: prev.at.toISOString(),
    phases,
  };
}
