/**
 * The growth dashboard's numbers, computed from stored snapshots and posts
 * (migration 040). Pure: no DB, no network — `npm run test:growth` covers it.
 */

export interface PostRow {
  tweetId: string;
  text: string;
  postedAt: Date;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  bookmarks: number;
  views: number;
  media: string[];
  isQuote: boolean;
}

export interface SnapshotRow {
  day: Date;
  followers: number;
  postsPerDay: number;
  engagementRate: number | null;
  mediaShare: number;
  avgViews: number;
  samplePosts: number;
}

export type Format = 'media' | 'thread' | 'quote' | 'text';
export const FORMAT_LABEL: Record<Format, string> = {
  media: 'With media',
  thread: 'Threads',
  quote: 'Quote posts',
  text: 'Text only',
};

const DAY_MS = 86_400_000;
const engaged = (p: PostRow) => p.likes + p.replies + p.reposts + p.quotes;
/** % of views that engaged; null when the post has no view count. */
export const postRate = (p: PostRow) => (p.views > 0 ? (engaged(p) / p.views) * 100 : null);

export function formatOf(p: PostRow): Format {
  if (/🧵|\b1\s?\/\s?\d+\b|\(1\/\d+\)/.test(p.text)) return 'thread';
  if (p.media.length > 0) return 'media';
  if (p.isQuote) return 'quote';
  return 'text';
}

/** Engagement rate and share of posts for each format (formats with no posts are left out). */
export function formatPerformance(posts: PostRow[]) {
  const out: {
    format: Format;
    label: string;
    rate: number | null;
    share: number;
    posts: number;
  }[] = [];
  for (const format of ['media', 'thread', 'quote', 'text'] as Format[]) {
    const group = posts.filter((p) => formatOf(p) === format);
    if (!group.length) continue;
    const viewed = group.filter((p) => p.views > 0);
    const views = viewed.reduce((s, p) => s + p.views, 0);
    out.push({
      format,
      label: FORMAT_LABEL[format],
      rate: views ? (viewed.reduce((s, p) => s + engaged(p), 0) / views) * 100 : null,
      share: Math.round((group.length / posts.length) * 100),
      posts: group.length,
    });
  }
  return out;
}

/** The UTC hour whose posts engage best (needs 2+ posts in that hour), or null. */
export function peakHour(posts: PostRow[]): number | null {
  const byHour = new Map<number, number[]>();
  for (const p of posts) {
    const r = postRate(p);
    if (r === null) continue;
    const h = p.postedAt.getUTCHours();
    byHour.set(h, [...(byHour.get(h) ?? []), r]);
  }
  let best: { hour: number; avg: number } | null = null;
  for (const [hour, rates] of byHour) {
    if (rates.length < 2) continue;
    const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
    if (!best || avg > best.avg) best = { hour, avg };
  }
  return best?.hour ?? null;
}

/**
 * Best two and worst one post by engagement rate, among posts with enough
 * views to mean something (≥ 25% of the median), each with a plain reason.
 */
export function bestAndWorst(posts: PostRow[]) {
  const rated = posts
    .map((p) => ({ p, rate: postRate(p) }))
    .filter((x): x is { p: PostRow; rate: number } => x.rate !== null);
  if (rated.length < 3) return { best: [], worst: null };
  const views = rated.map((x) => x.p.views).sort((a, b) => a - b);
  const median = views[Math.floor(views.length / 2)];
  const pool = rated.filter((x) => x.p.views >= median * 0.25).sort((a, b) => b.rate - a.rate);
  const avg = pool.reduce((s, x) => s + x.rate, 0) / pool.length;
  const hour = peakHour(posts);

  const reason = (x: { p: PostRow; rate: number }, good: boolean) => {
    const f = formatOf(x.p);
    const vsAvg = avg > 0 ? x.rate / avg : 1;
    const parts: string[] = [];
    if (good) {
      parts.push(`${vsAvg.toFixed(1)}× your average`);
      if (f !== 'text') parts.push(FORMAT_LABEL[f].toLowerCase());
      if (hour !== null && x.p.postedAt.getUTCHours() === hour)
        parts.push('posted at your peak hour');
    } else {
      parts.push(`${Math.round((1 - vsAvg) * 100)}% below your average`);
      if (x.p.text.trim().length < 40) parts.push('very short, no idea to engage with');
      else if (f === 'text') parts.push('text only');
    }
    return parts.join(' · ');
  };

  return {
    best: pool.slice(0, 2).map((x) => ({ ...x, why: reason(x, true) })),
    worst:
      pool.length >= 4
        ? { ...pool[pool.length - 1], why: reason(pool[pool.length - 1], false) }
        : null,
  };
}

/** Change between the latest snapshot and the one closest to `days` before it. */
export function delta(
  snaps: SnapshotRow[],
  pick: (s: SnapshotRow) => number | null,
  days = 7
): number | null {
  if (snaps.length < 2) return null;
  const sorted = [...snaps].sort((a, b) => a.day.getTime() - b.day.getTime());
  const last = sorted[sorted.length - 1];
  const target = last.day.getTime() - days * DAY_MS;
  const prev = sorted
    .slice(0, -1)
    .reduce((best, s) =>
      Math.abs(s.day.getTime() - target) < Math.abs(best.day.getTime() - target) ? s : best
    );
  const a = pick(last);
  const b = pick(prev);
  return a === null || b === null ? null : a - b;
}

/** Followers per day for the chart (oldest → newest), capped to `days`. */
export function followerSeries(snaps: SnapshotRow[], days = 30) {
  const sorted = [...snaps].sort((a, b) => a.day.getTime() - b.day.getTime());
  return sorted
    .slice(-days)
    .map((s) => ({ day: s.day.toISOString().slice(0, 10), followers: s.followers }));
}
