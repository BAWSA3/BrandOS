import type { DashboardData } from '@/components/dashboard/BentoDashboard';

/**
 * Data for the shareable brand-score card. Since 2026-10-14 the card IS the
 * dashboard's blue score tile (Jeffrey's call): the brand score, its change
 * ("▲ 4 SINCE SEP"), the score history line, and the four phases, plus the
 * person's photo, @handle and the BrandOS wordmark.
 */

export interface ScoreCardData {
  handle: string;
  avatarUrl: string | null;
  score: number;
  /** Change + the label it's measured from (null: first scan). */
  delta: { value: number; since: string } | null;
  /** Score history, oldest first ("Jan" → "Oct"). */
  history: { label: string; value: number }[];
  /** Define / Check / Generate / Scale. */
  phases: { key: string; value: number }[];
}

export function scoreCardData(d: DashboardData): ScoreCardData {
  const pts = d.scoreDetail ?? [];
  const cur = pts[pts.length - 1];
  const prev = pts.length > 1 ? pts[pts.length - 2] : null;
  const delta =
    d.scoreDelta ??
    (cur && prev ? { value: cur.value - prev.value, since: prev.label.split(' ')[0] } : null);
  return {
    handle: d.handle,
    avatarUrl: d.avatarUrl ?? d.pass.avatarUrl ?? null,
    score: cur?.value ?? d.ticker.score,
    delta,
    history: d.scoreHistory ?? [],
    phases: (cur?.phases ?? d.phases ?? []).slice(0, 4),
  };
}
