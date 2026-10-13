import prisma from '@/lib/db';
import {
  fetchTweetById,
  fetchUserTweets,
  type SocialDataPost,
  type SocialDataTweet,
} from '@/lib/socialdata';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import {
  brandForUser,
  clean,
  isOriginal,
  median,
  saveScores,
  scoreTweets,
  type PostBreakdownData,
} from '@/lib/post-scores';

// BrandOS post breakdown (the MCP's analyze_post). Same engine as the
// dashboard's "Recent posts analyzed" (src/lib/post-scores.ts), so a post gets
// the same read in Claude / ChatGPT as on the dashboard:
//   - the post is judged against its author's brand (their latest BrandOS scan
//     when they have an account, else their public scan, else their posts);
//   - when the person asking IS the author, the answer is written to them and
//     saved to their dashboard (or the dashboard's existing read is reused).
// Suggests, never rewrites the post.

const RECENT_POSTS = 20;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const SITE = 'https://mybrandos.app';

/** Landing link: opens mybrandos.app and runs this handle's full scan (?scan=), tagged for attribution. */
export function brandLink(handle: string, tool: string): string {
  return `${SITE}/?scan=${encodeURIComponent(handle)}&utm_source=mcp&utm_medium=${tool}&utm_campaign=brand_read`;
}

export interface PostAnalysis {
  handle: string;
  postId: string;
  excerpt: string;
  performance: string | null; // e.g. "3.2x their usual likes"
  archetype: string | null;
  pillars: string[];
  score: number | null;
  fit: number;
  breakdown: PostBreakdownData;
  /** Written to the author (it's their post) and on their dashboard. */
  own: boolean;
  /** Did fresh work (model call). False for cache hits / dashboard reuse: not metered. */
  fresh: boolean;
}

/** Post id from an x.com / twitter.com status URL (or a bare id). */
export function parsePostId(input: string): string | null {
  const s = input.trim();
  if (/^\d{5,25}$/.test(s)) return s;
  const m = s.match(
    /^https?:\/\/(?:www\.|mobile\.)?(?:x|twitter)\.com\/[A-Za-z0-9_]{1,15}\/status(?:es)?\/(\d{5,25})/i
  );
  return m ? m[1] : null;
}

const cache = new Map<string, { at: number; value: PostAnalysis }>();

function toTweet(p: SocialDataPost): SocialDataTweet {
  return {
    id: p.id,
    text: [
      p.text,
      p.media.length ? `[attached: ${p.media.join(' + ')}]` : '',
      p.quotedText ? `[quoting] ${p.quotedText}` : '',
    ]
      .filter(Boolean)
      .join('\n'),
    created_at: p.createdAt,
    public_metrics: {
      like_count: p.metrics.likes,
      retweet_count: p.metrics.reposts,
      reply_count: p.metrics.replies,
      quote_count: p.metrics.quotes,
      impression_count: p.metrics.views,
    },
  };
}

/**
 * Analyze a post. `viewerId` is the signed-in BrandOS user asking (if known).
 * Throws Error with a user-facing message on failure.
 */
export async function analyzePost(input: string, viewerId?: string | null): Promise<PostAnalysis> {
  const id = parsePostId(input);
  if (!id)
    throw new Error('That is not an X post link. Paste a link like https://x.com/name/status/123.');

  const { post, status } = await fetchTweetById(id);
  if (!post)
    throw new Error(
      status === 404
        ? "Couldn't find that post. Is it public?"
        : 'Could not load the post. Try again shortly.'
    );
  if (post.author.protected) throw new Error('That account is private, so BrandOS can’t read it.');
  const handle = post.author.username;

  // Is the author on BrandOS? Then their own scan is the brand, and if they're
  // the one asking, this is their post: answer to them, on their dashboard.
  const author = await prisma.platformConnection
    .findFirst({
      where: { platform: 'x', platformUserId: post.author.id, status: 'active' },
      select: { userId: true },
    })
    .catch(() => null);
  const own = !!viewerId && author?.userId === viewerId;

  const cacheKey = `${id}:${own ? 'own' : 'viewer'}`;
  const hit = cache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return { ...hit.value, fresh: false };

  const [{ tweets }, brand, publicScan, stored] = await Promise.all([
    fetchUserTweets(post.author.id, RECENT_POSTS + 5),
    author ? brandForUser(author.userId) : null,
    prisma.brandScans
      .findFirst({
        where: { username: { equals: handle, mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
        select: { score: true, archetype: true },
      })
      .catch(() => null),
    own
      ? prisma.postScore
          .findUnique({
            where: { userId_tweetId: { userId: viewerId!, tweetId: post.id } },
            select: { fit: true, breakdown: true },
          })
          .catch(() => null)
      : null,
  ]);
  const baseline = tweets.filter((t) => t.id !== post.id && isOriginal(t)).slice(0, RECENT_POSTS);
  const base = median(baseline.map((t) => t.public_metrics.like_count));
  const performance =
    base > 0
      ? `${(post.metrics.likes / base).toFixed(1)}x ${own ? 'your' : 'their'} usual likes`
      : null;
  const archetypeId = brand?.archetype ?? publicScan?.archetype ?? null;
  const archetype =
    archetypeId && archetypeId !== 'unknown'
      ? (getArchetypeInfo(archetypeId)?.name ?? archetypeId)
      : null;

  let fit: number;
  let breakdown: PostBreakdownData;
  if (stored) {
    // already on their dashboard: the same read, no model call
    fit = stored.fit;
    breakdown = stored.breakdown as unknown as PostBreakdownData;
  } else {
    const target = toTweet(post);
    const scores = await scoreTweets({
      audience: own ? 'owner' : 'viewer',
      handle,
      archetype: archetypeId,
      pillars: brand?.pillars ?? [],
      summary: brand?.summary ?? null,
      baseline,
      targets: [target],
    });
    const s = scores.get(post.id);
    if (!s) throw new Error('The analysis came back incomplete. Try again.');
    fit = s.fit;
    breakdown = s.data;
    if (own) await saveScores(viewerId!, [target], scores, baseline).catch(() => 0);
  }

  const value: PostAnalysis = {
    handle,
    postId: post.id,
    excerpt: clean(post.text).slice(0, 90),
    performance,
    archetype,
    pillars: brand?.pillars ?? [],
    score: brand?.score ?? publicScan?.score ?? null,
    fit,
    breakdown,
    own,
    fresh: !stored,
  };
  cache.set(cacheKey, { at: Date.now(), value });
  return value;
}

/** The tight chat-ready breakdown (~10 lines). */
export function renderPostAnalysis(a: PostAnalysis): string {
  const b = a.breakdown;
  const verdict = a.fit >= 80 ? 'On-brand' : a.fit >= 60 ? 'Close' : 'Off-brand';
  const brandBits = [
    a.archetype,
    a.score !== null ? `brand score ${a.score}/100` : null,
    a.pillars.length ? `pillars: ${a.pillars.join(' · ')}` : null,
  ].filter(Boolean);
  return [
    `BrandOS breakdown · @${a.handle}: "${a.excerpt}${a.excerpt.length >= 90 ? '…' : ''}"`,
    '',
    `${verdict} · ${a.fit}/100${a.performance ? ` · ${a.performance}` : ''}`,
    b.why,
    '',
    [b.voice && `Voice: ${b.voice}`, b.format && `Format: ${b.format}`].filter(Boolean).join(' · '),
    b.hook ? `Hook: ${b.hook}` : '',
    b.fits.length ? `What fit: ${b.fits.join(' · ')}` : '',
    b.misses.length ? `What drifted: ${b.misses.join(' · ')}` : '',
    b.sharpen.length ? `Next time: ${b.sharpen.map((t, i) => `${i + 1}) ${t}`).join('  ')}` : '',
    brandBits.length
      ? `\n${a.own ? 'Your brand' : `@${a.handle}'s brand`}: ${brandBits.join(' · ')}`
      : '',
    '',
    a.own
      ? `Saved to your dashboard: ${SITE}/dashboard?utm_source=mcp&utm_medium=analyze_post`
      : `Open @${a.handle}'s full brand read: ${brandLink(a.handle, 'analyze_post')}`,
  ]
    .filter((l, i, all) => l !== '' || (i > 0 && all[i - 1] !== ''))
    .join('\n');
}
