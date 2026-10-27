import {
  FORMAT_LABEL,
  formatOf,
  formatPerformance,
  peakHour,
  postRate,
  type Format,
  type PostRow,
} from '@/lib/growth-metrics';

/**
 * Draft scoring, the measured half (pure: no DB, no network; covered by
 * `npm run test:draft`). The model judges brand fit (src/lib/post-scores.ts);
 * this file measures the draft against the member's own history:
 *   - which format it is and how that format does for them,
 *   - the reach band ("likely 0.8–1.4× your usual views"),
 *   - data-backed fixes ("add the image: your media posts engage 1.8× your text posts"),
 *   - the final score: model fit, nudged by how the format performs for them.
 */

export interface DraftInput {
  text: string;
  /** An image, video or GIF is attached in the composer. */
  hasMedia?: boolean;
  /** Minutes east of UTC on the member's device (Date#getTimezoneOffset() * -1). */
  tzOffsetMin?: number;
}

export interface HistoryStats {
  posts: number;
  /** Median views per post. */
  medianViews: number;
  /** Engagement rate (% of views) across posts with views. */
  avgRate: number | null;
  formats: ReturnType<typeof formatPerformance>;
  /** UTC hour whose posts engage best, or null. */
  peakHourUtc: number | null;
  /** Views of each post by format, for the reach band. */
  viewsByFormat: Partial<Record<Format, number[]>>;
}

export interface Fix {
  text: string;
  /** Where it came from: their own numbers, or the model's read. */
  source: 'data' | 'model';
}

export interface DraftSignals {
  format: Format;
  formatLabel: string;
  /** This format's engagement rate ÷ their average (1 = average); null without data. */
  formatLift: number | null;
  /** Reach band as multiples of their median views, or null with too little history. */
  reach: { low: number; high: number } | null;
  fixes: Fix[];
  length: number;
  overLimit: boolean;
}

export const MAX_DRAFT_CHARS = 2_000;
export const MIN_DRAFT_CHARS = 12;
const X_LIMIT = 280;
const MIN_HISTORY = 5;

/** Characters as X counts them (code points). */
export const draftLength = (text: string) => [...text].length;

export function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function quantile(nums: number[], q: number): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const i = (s.length - 1) * q;
  const lo = Math.floor(i);
  const hi = Math.ceil(i);
  return s[lo] + (s[hi] - s[lo]) * (i - lo);
}

export function historyStats(posts: PostRow[]): HistoryStats {
  const viewed = posts.filter((p) => p.views > 0);
  const rates = viewed.map(postRate).filter((r): r is number => r !== null);
  const viewsByFormat: Partial<Record<Format, number[]>> = {};
  for (const p of viewed) (viewsByFormat[formatOf(p)] ??= []).push(p.views);
  const totalViews = viewed.reduce((s, p) => s + p.views, 0);
  const engaged = viewed.reduce((s, p) => s + p.likes + p.replies + p.reposts + p.quotes, 0);
  return {
    posts: posts.length,
    medianViews: median(viewed.map((p) => p.views)),
    avgRate: rates.length && totalViews ? (engaged / totalViews) * 100 : null,
    formats: formatPerformance(posts),
    peakHourUtc: peakHour(posts),
    viewsByFormat,
  };
}

/** The draft as a post row, so the dashboard's format rules apply to it unchanged. */
export function draftRow(d: DraftInput): PostRow {
  return {
    tweetId: 'draft',
    text: d.text,
    postedAt: new Date(),
    likes: 0,
    replies: 0,
    reposts: 0,
    quotes: 0,
    bookmarks: 0,
    views: 0,
    media: d.hasMedia ? ['photo'] : [],
    isQuote: false,
  };
}

/** "9pm" for a UTC hour shown in the member's own time. */
export function localHourLabel(hourUtc: number, tzOffsetMin = 0): string {
  const h = ((((hourUtc * 60 + tzOffsetMin) / 60) % 24) + 24) % 24;
  const whole = Math.floor(h);
  const suffix = whole < 12 ? 'am' : 'pm';
  const twelve = whole % 12 === 0 ? 12 : whole % 12;
  return `${twelve}${suffix}`;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function draftSignals(d: DraftInput, stats: HistoryStats, now = new Date()): DraftSignals {
  const row = draftRow(d);
  // a draft opening with "1/" is a thread, even before its length ("1/5") is known
  const format: Format = /^\s*\(?1\s?\/(?!\d)/.test(d.text) ? 'thread' : formatOf(row);
  const length = draftLength(d.text);
  const overLimit = length > X_LIMIT && format !== 'thread';
  const enough = stats.posts >= MIN_HISTORY && stats.avgRate !== null && stats.avgRate > 0;
  const rateOf = (f: Format) => stats.formats.find((x) => x.format === f && x.posts >= 2)?.rate;
  const own = rateOf(format);
  const formatLift = enough && own != null ? round1(own / stats.avgRate!) : null;

  // reach: their own views for this format (or all posts), as multiples of the median
  let reach: DraftSignals['reach'] = null;
  if (stats.posts >= MIN_HISTORY && stats.medianViews > 0) {
    const same = stats.viewsByFormat[format] ?? [];
    const pool = same.length >= 3 ? same : (Object.values(stats.viewsByFormat).flat() as number[]);
    if (pool.length >= 3) {
      const low = round1(Math.max(0.1, quantile(pool, 0.25) / stats.medianViews));
      const high = round1(Math.max(low, quantile(pool, 0.75) / stats.medianViews));
      reach = { low, high };
    }
  }

  const fixes: Fix[] = [];
  if (overLimit)
    fixes.push({
      text: `${length - X_LIMIT} characters over X's limit: cut it, or make it a thread (1/).`,
      source: 'data',
    });
  const media = rateOf('media');
  const text = rateOf('text');
  if (
    !d.hasMedia &&
    format !== 'thread' &&
    enough &&
    media != null &&
    text != null &&
    media >= text * 1.2
  )
    fixes.push({
      text: `Add an image: your posts with media engage ${round1(media / text)}× your text-only posts.`,
      source: 'data',
    });
  const thread = rateOf('thread');
  if (
    format !== 'thread' &&
    length > 220 &&
    enough &&
    thread != null &&
    thread >= stats.avgRate! * 1.2
  )
    fixes.push({
      text: `This much is a thread: your threads engage ${round1(thread / stats.avgRate!)}× your average.`,
      source: 'data',
    });
  if (stats.peakHourUtc !== null && enough) {
    const nowLocal = localHourLabel(now.getUTCHours(), d.tzOffsetMin);
    const best = localHourLabel(stats.peakHourUtc, d.tzOffsetMin);
    if (nowLocal !== best)
      fixes.push({
        text: `Your audience engages most around ${best} (your time). Consider posting then.`,
        source: 'data',
      });
  }
  const firstLine = d.text.trim().split('\n')[0] ?? '';
  if (draftLength(firstLine) > 120)
    fixes.push({
      text: 'Open with the payoff: your first line is long, so the point lands late.',
      source: 'data',
    });

  return {
    format,
    formatLabel: FORMAT_LABEL[format],
    formatLift,
    reach,
    fixes,
    length,
    overLimit,
  };
}

/**
 * The draft's score: the model's brand fit, nudged by how this format performs
 * for them (±8 at most; a format at 2× their average adds about 8).
 */
export function draftScore(fit: number, signals: Pick<DraftSignals, 'formatLift' | 'overLimit'>) {
  const lift = signals.formatLift;
  const nudge = lift && lift > 0 ? Math.max(-8, Math.min(8, Math.round(8 * Math.log2(lift)))) : 0;
  const penalty = signals.overLimit ? 5 : 0;
  return Math.max(0, Math.min(100, Math.round(fit + nudge - penalty)));
}

export function verdictOf(score: number): 'Ready to post' | 'Close' | 'Needs work' {
  return score >= 80 ? 'Ready to post' : score >= 60 ? 'Close' : 'Needs work';
}

/** Data fixes first (they're measured), then the model's, deduped, at most 3. */
export function topFixes(data: Fix[], model: string[], n = 3): Fix[] {
  const out: Fix[] = [];
  const seen = new Set<string>();
  const key = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z]/g, '')
      .slice(0, 24);
  for (const f of [...data, ...model.map((t) => ({ text: t, source: 'model' as const }))]) {
    const k = key(f.text);
    if (!f.text.trim() || seen.has(k)) continue;
    seen.add(k);
    out.push(f);
    if (out.length >= n) break;
  }
  return out;
}

/** Short lines for the prompt: what works for this member, from their own posts. */
export function historyNotes(stats: HistoryStats, tzOffsetMin = 0): string {
  if (stats.posts < MIN_HISTORY || stats.avgRate === null) return '';
  const lines = [
    `Median views per post: ${Math.round(stats.medianViews)}.`,
    `Average engagement: ${stats.avgRate.toFixed(1)}% of views.`,
    ...stats.formats
      .filter((f) => f.rate !== null && f.posts >= 2)
      .map((f) => `${f.label}: ${f.rate!.toFixed(1)}% engagement, ${f.share}% of posts.`),
  ];
  if (stats.peakHourUtc !== null)
    lines.push(`Best hour: ${localHourLabel(stats.peakHourUtc, tzOffsetMin)} (their time).`);
  return lines.join('\n');
}

/** A user-facing error with its HTTP status. */
export class DraftScoreError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export function validateDraft(raw: unknown): DraftInput {
  const body = (raw ?? {}) as Record<string, unknown>;
  const text = typeof body.text === 'string' ? body.text.replace(/\r\n/g, '\n').trim() : '';
  if ([...text].length < MIN_DRAFT_CHARS)
    throw new DraftScoreError('Write a little more first.', 400);
  if ([...text].length > MAX_DRAFT_CHARS)
    throw new DraftScoreError(`Drafts can be up to ${MAX_DRAFT_CHARS} characters.`, 400);
  const tz = Number(body.tzOffsetMin);
  return {
    text,
    hasMedia: body.hasMedia === true,
    tzOffsetMin: Number.isFinite(tz) && Math.abs(tz) <= 14 * 60 ? Math.round(tz) : 0,
  };
}
