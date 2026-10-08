import Anthropic from '@anthropic-ai/sdk';
import prisma from '@/lib/db';
import { fetchTweetById, fetchUserTweets, type SocialDataPost } from '@/lib/socialdata';
import { GUARD_PREAMBLE, wrapUntrusted } from '@/lib/prompt-safety';
import { clampScore, extractJson } from '@/lib/score-schemas';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';

// BrandOS post breakdown (the MCP's analyze_post): read an X post the way a
// brand strategist would, then the profile behind it, then why the two
// correlate. Order follows the funnel: post (voice, format, structure) ->
// profile (brand focus, taste) -> correlation (fit, why, what to sharpen).
// Suggests, never rewrites the post.

const MODEL = 'claude-sonnet-5';
const RECENT_POSTS = 20;
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const SITE = 'https://mybrandos.app';

/** Landing link: opens mybrandos.app and runs this handle's full scan (?scan=), tagged for attribution. */
export function brandLink(handle: string, tool: string): string {
  return `${SITE}/?scan=${encodeURIComponent(handle)}&utm_source=mcp&utm_medium=${tool}&utm_campaign=brand_read`;
}

export interface PostBreakdown {
  post: { voice: string; format: string; structure: string; hook: string; tasteSignals: string[] };
  profile: {
    focus: string;
    pillars: string[];
    taste: string;
    consistency: 'high' | 'medium' | 'low';
  };
  correlation: { fit: number; why: string; sharpen: string[] };
}

export interface PostAnalysis {
  handle: string;
  postId: string;
  excerpt: string;
  performance: string | null; // e.g. "3.2x their usual likes"
  archetype: string | null;
  score: number | null;
  breakdown: PostBreakdown;
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

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v: unknown, n: number, max: number) =>
  Array.isArray(v)
    ? v
        .filter((x): x is string => typeof x === 'string' && !!x.trim())
        .slice(0, n)
        .map((x) => x.trim().slice(0, max))
    : [];

/** Validate + clamp the model's JSON. Null when it isn't a usable breakdown. */
function parseBreakdown(text: string): PostBreakdown | null {
  const raw = extractJson(text) as Record<string, Record<string, unknown>> | null;
  if (!raw || typeof raw !== 'object' || !raw.post || !raw.profile || !raw.correlation) return null;
  const { post, profile, correlation } = raw;
  if (typeof correlation.fit !== 'number') return null;
  const consistency = ['high', 'medium', 'low'].includes(String(profile.consistency))
    ? (profile.consistency as 'high' | 'medium' | 'low')
    : 'medium';
  const out: PostBreakdown = {
    post: {
      voice: str(post.voice, 140),
      format: str(post.format, 100),
      structure: str(post.structure, 160),
      hook: str(post.hook, 160),
      tasteSignals: list(post.tasteSignals, 4, 60),
    },
    profile: {
      focus: str(profile.focus, 180),
      pillars: list(profile.pillars, 4, 60),
      taste: str(profile.taste, 180),
      consistency,
    },
    correlation: {
      fit: clampScore(correlation.fit),
      why: str(correlation.why, 320),
      sharpen: list(correlation.sharpen, 2, 160),
    },
  };
  return out.post.voice && out.profile.focus && out.correlation.why ? out : null;
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function buildPrompt(
  post: SocialDataPost,
  recent: { text: string; likes: number }[],
  performance: string | null,
  archetype: string | null
): string {
  const a = post.author;
  const recentBlock = recent
    .map((t, i) => `${i + 1}. (${t.likes} likes) ${t.text.replace(/\s+/g, ' ').slice(0, 280)}`)
    .join('\n');
  return `${GUARD_PREAMBLE}
You are BrandOS, a brand strategist who reads taste. Break down one X post, then the profile behind it, then explain why the post correlates with (or drifts from) that person's brand.

Rules:
- Be specific to the evidence below. No generic social-media advice.
- "Taste" means what they are drawn to and how they express it: aesthetic, references, vocabulary, rhythm, formats.
- Refer to the person as @handle or "they". Never assume gender.
- The reader can't see the numbered list: never cite "post 7"; quote a few words instead.
- Never rewrite the post. "sharpen" items are short, concrete suggestions; the person decides.
- Keep every field short (one line). Pillars are 2-4 word labels. Return ONLY JSON in exactly this shape:
{"post":{"voice":"","format":"","structure":"","hook":"","tasteSignals":["",""]},
 "profile":{"focus":"","pillars":["",""],"taste":"","consistency":"high|medium|low"},
 "correlation":{"fit":0,"why":"","sharpen":["",""]}}
"fit" is 0-100: how on-brand this post is for THIS person, judged against their recent posts.

THE POST (by @${a.username}${post.media.length ? `, with ${post.media.join(' + ')}` : ''}${post.isReply ? ', a reply' : ''}):
${wrapUntrusted(post.text, 'post_text', 2000)}
${post.quotedText ? `It quotes:\n${wrapUntrusted(post.quotedText, 'quoted_post', 1000)}\n` : ''}Engagement: ${post.metrics.likes} likes, ${post.metrics.reposts} reposts, ${post.metrics.replies} replies, ${post.metrics.bookmarks} bookmarks, ${post.metrics.views} views.${performance ? ` That is ${performance}.` : ''}

THE PROFILE: ${a.name} (@${a.username}), ${a.public_metrics.followers_count} followers${archetype ? `, BrandOS archetype ${archetype}` : ''}.
Bio:
${wrapUntrusted(a.description || '(empty)', 'bio', 400)}

THEIR RECENT ORIGINAL POSTS:
${wrapUntrusted(recentBlock || '(none available)', 'recent_posts', 7000)}`;
}

/** Analyze a post. Throws Error with a user-facing message on failure. */
export async function analyzePost(input: string): Promise<PostAnalysis> {
  const id = parsePostId(input);
  if (!id)
    throw new Error('That is not an X post link. Paste a link like https://x.com/name/status/123.');

  const hit = cache.get(id);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

  const { post, status } = await fetchTweetById(id);
  if (!post)
    throw new Error(
      status === 404
        ? "Couldn't find that post. Is it public?"
        : 'Could not load the post. Try again shortly.'
    );
  if (post.author.protected) throw new Error('That account is private, so BrandOS can’t read it.');

  const handle = post.author.username;
  const [{ tweets }, scan] = await Promise.all([
    fetchUserTweets(post.author.id, RECENT_POSTS + 5),
    prisma.brandScans
      .findFirst({
        where: { username: { equals: handle, mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
        select: { score: true, archetype: true },
      })
      .catch(() => null),
  ]);
  const recent = tweets
    .filter((t) => t.id !== post.id)
    .slice(0, RECENT_POSTS)
    .map((t) => ({ text: t.text, likes: t.public_metrics.like_count }));

  const base = median(recent.map((r) => r.likes));
  const performance =
    base > 0 ? `${(post.metrics.likes / base).toFixed(1)}x their usual likes` : null;
  const archetype = scan?.archetype
    ? (getArchetypeInfo(scan.archetype)?.name ?? scan.archetype)
    : null;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Analysis is unavailable right now.');
  const message = await new Anthropic({ apiKey }).messages.create({
    model: MODEL,
    max_tokens: 1200,
    thinking: { type: 'disabled' },
    messages: [{ role: 'user', content: buildPrompt(post, recent, performance, archetype) }],
  });
  const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
  const breakdown = parseBreakdown(text);
  if (!breakdown) throw new Error('The analysis came back incomplete. Try again.');

  const value: PostAnalysis = {
    handle,
    postId: post.id,
    excerpt: post.text
      .replace(/\s+/g, ' ')
      .replace(/https:\/\/t\.co\/\S+/g, '')
      .trim()
      .slice(0, 90),
    performance,
    archetype,
    score: scan?.score ?? null,
    breakdown,
  };
  cache.set(id, { at: Date.now(), value });
  return value;
}

/** The tight chat-ready breakdown (~10 lines). */
export function renderPostAnalysis(a: PostAnalysis): string {
  const { post, profile, correlation } = a.breakdown;
  const link = brandLink(a.handle, 'analyze_post');
  return [
    `BrandOS breakdown · @${a.handle}: "${a.excerpt}${a.excerpt.length >= 90 ? '…' : ''}"`,
    '',
    `THE POST: ${post.voice}. ${post.format}. ${post.structure}.`,
    `Hook: ${post.hook}`,
    `Taste signals: ${post.tasteSignals.join(' · ')}`,
    '',
    `THE PROFILE${a.archetype ? ` (${a.archetype})` : ''}: ${profile.focus}`,
    `Pillars: ${profile.pillars.join(' · ')} · Consistency: ${profile.consistency}`,
    `Taste: ${profile.taste}`,
    '',
    `WHY IT FITS (${correlation.fit}/100${a.performance ? `, ${a.performance}` : ''}): ${correlation.why}`,
    `Sharpen: ${correlation.sharpen.map((s, i) => `${i + 1}) ${s}`).join('  ')}`,
    '',
    `Open @${a.handle}'s full brand dashboard: ${link}`,
    `Get your own brand read: ${SITE}/?utm_source=mcp&utm_medium=analyze_post&utm_campaign=own_read`,
  ].join('\n');
}
