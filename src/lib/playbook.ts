/**
 * The Playbook (dashboard v2, slice 2): the brand's living page, read-only for
 * now. Pure helpers, client-safe; the page loads the rows (src/app/dashboard).
 * Tested in scripts/test-dashboard-v2.ts.
 */

export interface WeekOfWork {
  /** ISO date (UTC) the week starts on, oldest first */
  start: string;
  ideas: number;
  drafts: number;
  posts: number;
  /** the score at the end of the week (carried forward from the last read), null before the first */
  score: number | null;
}

const DAY = 86_400_000;

/**
 * Body of work, per week: ideas written, ideas taken to a draft, posts out on
 * X, and where the score stood. The compounding story in one chart.
 */
export function bodyOfWork(
  input: {
    ideas: { createdAt: Date | string; status: string }[];
    posts: { postedAt: Date | string }[];
    reads: { at: Date | string; score: number }[];
  },
  now: Date,
  weeks = 8
): WeekOfWork[] {
  const end = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + DAY;
  const first = end - weeks * 7 * DAY;
  const out: WeekOfWork[] = Array.from({ length: weeks }, (_, i) => ({
    start: new Date(first + i * 7 * DAY).toISOString().slice(0, 10),
    ideas: 0,
    drafts: 0,
    posts: 0,
    score: null,
  }));
  const slot = (d: Date | string) => {
    const t = new Date(d).getTime();
    if (!Number.isFinite(t) || t < first || t >= end) return -1;
    return Math.floor((t - first) / (7 * DAY));
  };
  for (const i of input.ideas) {
    const k = slot(i.createdAt);
    if (k < 0) continue;
    out[k].ideas++;
    if (i.status === 'drafting' || i.status === 'posted') out[k].drafts++;
  }
  for (const p of input.posts) {
    const k = slot(p.postedAt);
    if (k >= 0) out[k].posts++;
  }
  const reads = [...input.reads]
    .map((r) => ({ t: new Date(r.at).getTime(), score: r.score }))
    .filter((r) => Number.isFinite(r.t))
    .sort((a, b) => a.t - b.t);
  out.forEach((w, i) => {
    const weekEnd = first + (i + 1) * 7 * DAY;
    const last = reads.filter((r) => r.t < weekEnd).at(-1);
    w.score = last ? last.score : null;
  });
  return out;
}

/** "41 ideas → 24 drafts → 30 posts" plus the score move, or null when there's nothing yet. */
export function workLine(weeks: WeekOfWork[]): string | null {
  const t = weeks.reduce(
    (a, w) => ({ ideas: a.ideas + w.ideas, drafts: a.drafts + w.drafts, posts: a.posts + w.posts }),
    { ideas: 0, drafts: 0, posts: 0 }
  );
  if (!t.ideas && !t.posts) return null;
  const scores = weeks.map((w) => w.score).filter((s): s is number => s !== null);
  const move =
    scores.length >= 2 && scores[0] !== scores.at(-1)
      ? ` · score ${scores[0]} → ${scores.at(-1)}`
      : '';
  const n = (v: number, one: string, many: string) => `${v} ${v === 1 ? one : many}`;
  return `${n(t.ideas, 'idea', 'ideas')} → ${n(t.drafts, 'draft', 'drafts')} → ${n(t.posts, 'post', 'posts')}${move}`;
}
