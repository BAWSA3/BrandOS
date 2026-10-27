import { createHash } from 'crypto';
import prisma from '@/lib/db';
import { fetchUserTweets, type SocialDataTweet } from '@/lib/socialdata';
import { brandForUser, isOriginal, scoreTweets, type ScoreUsage } from '@/lib/post-scores';
import type { PostRow } from '@/lib/growth-metrics';
import {
  draftScore,
  draftSignals,
  historyNotes,
  historyStats,
  topFixes,
  verdictOf,
  DraftScoreError,
  type DraftInput,
  type Fix,
} from '@/lib/draft-signals';

export { DraftScoreError, validateDraft } from '@/lib/draft-signals';

/**
 * Server-only. "Score this draft": a post is scored before it goes out, against
 * the member's own brand and history. Same engine as the dashboard's per-post
 * scores and the MCP's analyze_post (src/lib/post-scores.ts, mode 'draft'),
 * plus the measured signals in src/lib/draft-signals.ts.
 *
 * History comes from what BrandOS already stores (the brand's synced posts,
 * then the member's scored posts), so most scores cost one model call and no
 * SocialData reads. Results are cached per member + brand + draft for an hour.
 * Callers own auth, plan and rate limits; the draft is untrusted text
 * (wrapUntrusted in the prompt; the model's JSON is validated and clamped).
 */

const HISTORY = 40;
const BASELINE = 20;
const CACHE_TTL_MS = 60 * 60 * 1000;
// claude-sonnet-5 (the post-scores model): $2 / $10 per million tokens
const USD_PER_INPUT_TOKEN = 2 / 1_000_000;
const USD_PER_OUTPUT_TOKEN = 10 / 1_000_000;

export interface DraftScoreResult {
  score: number;
  verdict: ReturnType<typeof verdictOf>;
  fit: number;
  format: string;
  /** This format's engagement ÷ their average, e.g. 1.8 ("1.8× your average"). */
  formatLift: number | null;
  /** Likely views as multiples of their median, e.g. { low: 0.8, high: 1.4 }. */
  reach: { low: number; high: number } | null;
  /** The top 2-3 fixes, measured ones first. */
  fixes: Fix[];
  voice: string;
  hook: string;
  why: string;
  fits: string[];
  misses: string[];
  handle: string;
  /** How many of their posts the measured part is based on. */
  basedOn: number;
  cached: boolean;
}

const cache = new Map<string, { at: number; value: DraftScoreResult }>();

function cacheKey(userId: string, brandKey: string, d: DraftInput) {
  return createHash('sha256')
    .update(`${userId}\n${brandKey}\n${d.hasMedia ? 1 : 0}\n${d.text.trim()}`)
    .digest('hex');
}

function toTweet(p: PostRow): SocialDataTweet {
  return {
    id: p.tweetId,
    text: [p.text, p.media.length ? `[attached: ${p.media.join(' + ')}]` : '']
      .filter(Boolean)
      .join('\n'),
    created_at: p.postedAt.toISOString(),
    public_metrics: {
      like_count: p.likes,
      retweet_count: p.reposts,
      reply_count: p.replies,
      quote_count: p.quotes,
      impression_count: p.views,
    },
  };
}

function fromTweet(t: SocialDataTweet): PostRow {
  return {
    tweetId: t.id,
    text: t.text,
    postedAt: new Date(t.created_at),
    likes: t.public_metrics.like_count,
    replies: t.public_metrics.reply_count,
    reposts: t.public_metrics.retweet_count,
    quotes: t.public_metrics.quote_count,
    bookmarks: t.public_metrics.bookmark_count ?? 0,
    views: t.public_metrics.impression_count ?? 0,
    media: t.media ?? [],
    isQuote: !!t.is_quote,
  };
}

/** Which brand the draft is for: a tracked brand in their workspace, else their own X account. */
async function resolveBrand(userId: string, workspaceId: string | null, accountId?: string) {
  const x = await prisma.platformConnection.findFirst({
    where: { userId, platform: 'x', status: 'active' },
    select: { platformUserId: true, platformUsername: true },
  });
  let account: { id: string; handle: string; displayHandle: string } | null = null;
  if (workspaceId) {
    const where = { workspaceId, competitorOfId: null };
    account =
      (accountId
        ? await prisma.trackedAccount.findFirst({
            where: { ...where, id: accountId },
            select: { id: true, handle: true, displayHandle: true },
          })
        : null) ??
      (x
        ? await prisma.trackedAccount.findFirst({
            where: { ...where, handle: x.platformUsername.toLowerCase() },
            select: { id: true, handle: true, displayHandle: true },
          })
        : null) ??
      (accountId
        ? null
        : await prisma.trackedAccount.findFirst({
            where,
            orderBy: { createdAt: 'asc' },
            select: { id: true, handle: true, displayHandle: true },
          }));
    if (accountId && !account) throw new DraftScoreError('Not found', 404);
  }
  const handle = account?.displayHandle ?? x?.platformUsername ?? null;
  if (!handle) throw new DraftScoreError('Connect your X account first.', 400);
  const own = !!x && handle.toLowerCase() === x.platformUsername.toLowerCase();
  return { account, x, handle, own };
}

/** Their recent original posts: stored first (free), SocialData only as a last resort. */
async function loadHistory(
  userId: string,
  brand: Awaited<ReturnType<typeof resolveBrand>>
): Promise<PostRow[]> {
  if (brand.account) {
    const rows = await prisma.accountPost
      .findMany({
        where: { accountId: brand.account.id },
        orderBy: { postedAt: 'desc' },
        take: HISTORY,
      })
      .catch(() => []);
    const originals = rows.filter((r) => !/^RT @/.test(r.text) && !/^@\w/.test(r.text.trim()));
    if (originals.length >= 5) return originals;
  }
  if (brand.own) {
    const scored = await prisma.postScore
      .findMany({
        where: { userId },
        orderBy: { postedAt: 'desc' },
        take: HISTORY,
        select: {
          tweetId: true,
          excerpt: true,
          postedAt: true,
          likes: true,
          replies: true,
          reposts: true,
          views: true,
        },
      })
      .catch(() => []);
    if (scored.length >= 5)
      return scored.map((p) => ({
        tweetId: p.tweetId,
        text: p.excerpt,
        postedAt: p.postedAt,
        likes: p.likes,
        replies: p.replies,
        reposts: p.reposts,
        quotes: 0,
        bookmarks: 0,
        views: p.views,
        media: [],
        isQuote: false,
      }));
    if (brand.x) {
      const { tweets } = await fetchUserTweets(brand.x.platformUserId, BASELINE + 10);
      return tweets.filter(isOriginal).map(fromTweet);
    }
  }
  return [];
}

/** The brand read a draft is judged against. */
async function loadBrandRead(userId: string, handle: string, own: boolean) {
  if (own) {
    const b = await brandForUser(userId);
    if (b.archetype || b.summary) return b;
  }
  const row = await prisma.brandScans
    .findFirst({
      where: { username: { equals: handle, mode: 'insensitive' }, summary: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { archetype: true, summary: true, contentPillars: true, score: true },
    })
    .catch(() => null);
  let pillars: string[] = [];
  try {
    const p = row?.contentPillars ? (JSON.parse(row.contentPillars) as unknown) : null;
    if (Array.isArray(p)) pillars = p.filter((x): x is string => typeof x === 'string').slice(0, 4);
  } catch {
    pillars = [];
  }
  return {
    archetype: row?.archetype ?? null,
    pillars,
    summary: row?.summary ?? null,
    score: row?.score ?? null,
  };
}

function logCost(userId: string, u: ScoreUsage, ms: number) {
  const usd = u.inputTokens * USD_PER_INPUT_TOKEN + u.outputTokens * USD_PER_OUTPUT_TOKEN;
  console.info(
    `[draft-score] user=${userId} model=${u.model} in=${u.inputTokens} out=${u.outputTokens} cost=$${usd.toFixed(4)} ms=${ms}`
  );
}

/**
 * Score a draft for a signed-in member. `accountId` picks a tracked brand in
 * their workspace (SMMs); default is their own X account's brand.
 * Throws DraftScoreError (message is user-facing).
 */
export async function scoreDraft(opts: {
  userId: string;
  workspaceId: string | null;
  draft: DraftInput;
  accountId?: string;
}): Promise<DraftScoreResult> {
  const brand = await resolveBrand(opts.userId, opts.workspaceId, opts.accountId);
  const key = cacheKey(opts.userId, brand.account?.id ?? brand.handle, opts.draft);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return { ...hit.value, cached: true };

  const [history, read] = await Promise.all([
    loadHistory(opts.userId, brand),
    loadBrandRead(opts.userId, brand.handle, brand.own),
  ]);
  const stats = historyStats(history);
  const signals = draftSignals(opts.draft, stats);

  const started = Date.now();
  const meter: { usage: ScoreUsage | null } = { usage: null };
  const target: SocialDataTweet = {
    id: 'draft',
    text: [opts.draft.text, opts.draft.hasMedia ? '[attached: image]' : '']
      .filter(Boolean)
      .join('\n'),
    created_at: new Date().toISOString(),
    public_metrics: {
      like_count: 0,
      retweet_count: 0,
      reply_count: 0,
      quote_count: 0,
      impression_count: 0,
    },
  };
  let scores;
  try {
    scores = await scoreTweets({
      mode: 'draft',
      audience: brand.own ? 'owner' : 'viewer',
      handle: brand.handle,
      archetype: read.archetype,
      pillars: read.pillars,
      summary: read.summary,
      notes: historyNotes(stats, opts.draft.tzOffsetMin),
      baseline: history.slice(0, BASELINE).map(toTweet),
      targets: [target],
      onUsage: (u) => {
        meter.usage = u;
      },
    });
  } catch (e) {
    console.error('[draft-score] model call failed:', e);
    throw new DraftScoreError('Scoring is unavailable right now. Try again shortly.', 503);
  }
  if (meter.usage) logCost(opts.userId, meter.usage, Date.now() - started);
  const s = scores.get('draft');
  if (!s) throw new DraftScoreError('The score came back incomplete. Try again.', 502);

  const score = draftScore(s.fit, signals);
  const value: DraftScoreResult = {
    score,
    verdict: verdictOf(score),
    fit: s.fit,
    format: signals.formatLabel,
    formatLift: signals.formatLift,
    reach: signals.reach,
    fixes: topFixes(signals.fixes, s.data.sharpen),
    voice: s.data.voice,
    hook: s.data.hook,
    why: s.data.why,
    fits: s.data.fits,
    misses: s.data.misses,
    handle: brand.handle,
    basedOn: history.length,
    cached: false,
  };
  if (cache.size > 2_000) cache.clear();
  cache.set(key, { at: Date.now(), value });
  return value;
}
