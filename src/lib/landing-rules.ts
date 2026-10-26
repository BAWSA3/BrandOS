import { indexEnabled } from '@/lib/index-rules';

/** Pure rules for the homepage landing scroll (tested in scripts/test-field.ts). */

export type Phases = { define: number; check: number; generate: number; scale: number };

/** The Index opens to the public on 2 Nov 2026, 00:00 in Los Angeles (PDT = UTC-7). */
export const INDEX_OPENS_AT = Date.parse('2026-11-02T07:00:00Z');

export const indexOpen = (now = Date.now()) => indexEnabled() || now >= INDEX_OPENS_AT;

/** Parses a BrandScans.phase_scores JSON string; null if it isn't the four phases. Pure (tested). */
export function parsePhases(raw: string | null | undefined): Phases | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    const n = (k: string) => (typeof p[k] === 'number' ? Math.round(p[k] as number) : NaN);
    const phases = {
      define: n('define'),
      check: n('check'),
      generate: n('generate'),
      scale: n('scale'),
    };
    return Object.values(phases).every((v) => Number.isFinite(v) && v >= 0 && v <= 100)
      ? phases
      : null;
  } catch {
    return null;
  }
}

/** A real account's latest read, as a candidate for the homepage's "Recent reads". */
export interface ReadCandidate {
  handle: string;
  score: number;
  archetype: string | null;
  phases: Phases | null;
  summary: string | null;
  pillars: string[];
  avatar: string | null;
  name: string | null;
  readAt: string; // ISO
  /** A company / product account (`isLikelyCompany`): never shown as a person. */
  company?: boolean;
}

/** A homepage card for a recent read: a public read, never an Index entry. */
export interface RecentRead {
  handle: string;
  name: string | null;
  avatar: string | null;
  score: number;
  archetype: string;
  blurb: string;
  niches: string[];
  readAt: string;
}

/** The read's first sentence, cut at a word to fit a card. Pure (tested). */
export function readLine(summary: string | null | undefined, max = 96): string {
  const first =
    (summary ?? '')
      .trim()
      .split(/(?<=[.!?])\s/)[0]
      ?.trim() ?? '';
  if (first.length <= max) return first;
  const cut = first.slice(0, max - 1);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 40 ? cut.lastIndexOf(' ') : cut.length).replace(/[,;:\s]+$/, '')}…`;
}

/**
 * Picks the homepage's "Recent reads" before the Index opens: the highest
 * scores among accounts read lately, one per class first so the run shows the
 * range, then the next highest. Only complete reads with a real picture: a
 * read with no phases, no summary or no class is a broken or fallback scan.
 * Companies and products are skipped: the run shows people.
 * Input is one candidate per handle (their latest read). Pure (tested).
 */
export function pickRecentReads(
  candidates: ReadCandidate[],
  classOf: (archetype: string | null) => string | null,
  limit = 8
): RecentRead[] {
  const seen = new Set<string>();
  const ok = candidates
    .filter((c) => {
      const h = c.handle.toLowerCase();
      if (seen.has(h)) return false;
      seen.add(h);
      return (
        !c.company &&
        c.phases !== null &&
        !!c.summary?.trim() &&
        !!c.avatar &&
        classOf(c.archetype) !== null &&
        c.score > 0 &&
        c.score < 100
      );
    })
    .sort((a, b) => b.score - a.score || b.readAt.localeCompare(a.readAt));
  const picked: ReadCandidate[] = [];
  const classes = new Set<string>();
  for (const c of ok) {
    const cls = classOf(c.archetype)!;
    if (classes.has(cls) || picked.length >= limit) continue;
    classes.add(cls);
    picked.push(c);
  }
  for (const c of ok) {
    if (picked.length >= limit) break;
    if (!picked.includes(c)) picked.push(c);
  }
  return picked
    .sort((a, b) => b.score - a.score)
    .map((c) => ({
      handle: c.handle.toLowerCase(),
      name: c.name,
      avatar: c.avatar,
      score: c.score,
      archetype: classOf(c.archetype)!,
      blurb: readLine(c.summary),
      niches: c.pillars.filter((p) => p.length <= 32).slice(0, 2),
      readAt: c.readAt,
    }));
}
