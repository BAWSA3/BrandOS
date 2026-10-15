import type { DashboardData } from '@/components/dashboard/BentoDashboard';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';

/**
 * Data for the shareable brand-score card (spec 2026-10-14): the brand score,
 * its change, and three bullets built from what the dashboard already knows
 * (no model call):
 *   up    what's working: the phase that rose most since the last scan, else
 *         the best post's strongest "what fit", else the strongest phase
 *   down  what drifted: the weakest post's main "what drifted", else the phase
 *         that fell most, else the weakest phase
 *   best  the best-fit recent post (short quote + fit)
 */

export interface ScoreCardData {
  handle: string;
  avatarUrl: string | null;
  archetype: string | null;
  tagline: string | null;
  score: number;
  /** Change since the previous scan (null: first scan). */
  delta: number | null;
  /** "Oct 14" */
  date: string;
  bullets: { up: string | null; down: string | null; best: string | null };
}

const clip = (t: string, n: number) => {
  const s = t.replace(/\s+/g, ' ').trim();
  return s.length > n ? `${s.slice(0, n - 1).replace(/\s+\S*$/, '')}…` : s;
};
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function scoreCardData(d: DashboardData, now = new Date()): ScoreCardData {
  const pts = d.scoreDetail ?? [];
  const cur = pts[pts.length - 1];
  const prev = pts.length > 1 ? pts[pts.length - 2] : null;
  const score = cur?.value ?? d.ticker.score;
  const delta = d.scoreDelta?.value ?? (cur && prev ? cur.value - prev.value : null);

  // phase moves since the previous scan
  const phases = cur?.phases ?? d.phases ?? [];
  const moves = phases.map((p) => ({
    ...p,
    delta: prev ? p.value - (prev.phases.find((q) => q.key === p.key)?.value ?? p.value) : 0,
  }));
  const rose = [...moves].sort((a, b) => b.delta - a.delta)[0];
  const fell = [...moves].sort((a, b) => a.delta - b.delta)[0];
  const strongest = [...phases].sort((a, b) => b.value - a.value)[0];
  const weakest = [...phases].sort((a, b) => a.value - b.value)[0];

  const posts = d.posts.filter((p) => p.breakdown);
  const best = [...d.posts].sort((a, b) => b.fit - a.fit)[0];
  const worst = [...posts].sort((a, b) => a.fit - b.fit)[0];

  const up =
    rose && rose.delta > 0
      ? `${rose.key} +${rose.delta}${cur?.insights?.[rose.key]?.[0] ? `: ${cur.insights[rose.key][0]}` : ''}`
      : best?.breakdown?.fits?.[0]
        ? cap(best.breakdown.fits[0])
        : strongest
          ? `${strongest.key} is your strongest phase (${strongest.value})`
          : null;
  const down = worst?.breakdown?.misses?.[0]
    ? cap(worst.breakdown.misses[0])
    : fell && fell.delta < 0
      ? `${fell.key} ${fell.delta}`
      : weakest
        ? `${weakest.key} is your weakest phase (${weakest.value})`
        : null;
  const bestLine = best ? `“${clip(best.excerpt, 52)}” · ${best.fit} fit` : null;

  const info = d.pass.archetype ? getArchetypeInfo(d.pass.archetype) : null;
  return {
    handle: d.handle,
    avatarUrl: d.avatarUrl ?? d.pass.avatarUrl ?? null,
    archetype: info?.name ?? d.pass.archetype ?? null,
    tagline: info?.tagline ?? null,
    score,
    delta,
    date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    bullets: {
      up: up ? clip(up, 96) : null,
      down: down ? clip(down, 96) : null,
      best: bestLine,
    },
  };
}
