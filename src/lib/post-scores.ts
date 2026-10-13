import Anthropic from '@anthropic-ai/sdk';
import prisma from '@/lib/db';
import { fetchUserTweets, type SocialDataTweet } from '@/lib/socialdata';
import { GUARD_PREAMBLE, wrapUntrusted } from '@/lib/prompt-safety';
import { clampScore, extractJson } from '@/lib/score-schemas';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';

/**
 * Server-only. Scores a signed-in user's latest original X posts for brand fit
 * and stores a breakdown per post ("PostScore", migration 033): voice, format,
 * hook, why it scored that way, what fit, what drifted, and 2-3 suggestions.
 *
 * One model call scores up to MAX_NEW posts at once, judged against the user's
 * brand from their latest scan (archetype, pillars, summary) and their recent
 * posts as the baseline. Posts already scored are skipped. Post text is
 * untrusted (wrapUntrusted); the model's JSON is validated and clamped.
 * Suggests, never rewrites.
 */

const MODEL = 'claude-sonnet-5';
const MAX_NEW = 5;
const BASELINE = 20;

export interface PostBreakdownData {
  voice: string;
  format: string;
  hook: string;
  why: string;
  fits: string[];
  misses: string[];
  sharpen: string[];
}

const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v: unknown, n: number, max: number) =>
  Array.isArray(v)
    ? v
        .filter((x): x is string => typeof x === 'string' && !!x.trim())
        .slice(0, n)
        .map((x) => x.trim().slice(0, max))
    : [];

const clean = (t: string) =>
  t
    .replace(/https:\/\/t\.co\/\S+/g, '')
    .replace(/\s+/g, ' ')
    .trim();
/** Originals only: no retweets or replies. */
const isOriginal = (t: SocialDataTweet) => !/^RT @/.test(t.text) && !/^@\w/.test(t.text.trim());

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function buildPrompt(opts: {
  handle: string;
  archetype: string | null;
  pillars: string[];
  summary: string | null;
  baseline: SocialDataTweet[];
  targets: SocialDataTweet[];
}): string {
  const brand = [
    opts.archetype ? `Archetype: ${opts.archetype}` : null,
    opts.pillars.length ? `Content pillars: ${opts.pillars.join(', ')}` : null,
    opts.summary ? `Brand read: ${opts.summary}` : null,
  ]
    .filter(Boolean)
    .join('\n');
  const baselineBlock = opts.baseline
    .map((t) => `- (${t.public_metrics.like_count} likes) ${clean(t.text).slice(0, 240)}`)
    .join('\n');
  const targetsBlock = opts.targets
    .map(
      (t) =>
        `[id ${t.id}] (${t.public_metrics.like_count} likes, ${t.public_metrics.reply_count} replies) ${clean(t.text).slice(0, 600)}`
    )
    .join('\n');
  return `${GUARD_PREAMBLE}
You are BrandOS, a brand strategist who reads taste. Score each TARGET post by @${opts.handle} for how on-brand it is for THIS person, judged against their brand and their recent posts.

Rules:
- Be specific to the evidence. No generic social-media advice.
- Write every field TO the person, in second person ("you", "your posts"). Never "they", "their" or "the account". Never assume gender.
- Never rewrite a post. "sharpen" items are short, concrete suggestions for the next post like it; the person decides.
- Every string is one short line. Return ONLY JSON, exactly:
{"posts":[{"id":"","fit":0,"voice":"","format":"","hook":"","why":"","fits":["",""],"misses":[""],"sharpen":["",""]}]}
- "fit" is 0-100. "why" explains the score in one sentence. "fits" = what matched the brand; "misses" = what drifted (may be empty for strong posts); "sharpen" = 2-3 suggestions.
- Include every target id exactly once.

THEIR BRAND (from the latest BrandOS scan):
${brand || '(no scan details)'}

THEIR RECENT POSTS (baseline):
${wrapUntrusted(baselineBlock || '(none)', 'recent_posts', 6000)}

TARGET POSTS TO SCORE:
${wrapUntrusted(targetsBlock, 'target_posts', 4000)}`;
}

function parse(
  text: string,
  ids: Set<string>
): Map<string, { fit: number; data: PostBreakdownData }> {
  const out = new Map<string, { fit: number; data: PostBreakdownData }>();
  const raw = extractJson(text) as { posts?: unknown } | null;
  if (!raw || !Array.isArray(raw.posts)) return out;
  for (const p of raw.posts as Record<string, unknown>[]) {
    const id = typeof p?.id === 'string' ? p.id : String(p?.id ?? '');
    if (!ids.has(id) || typeof p.fit !== 'number') continue;
    const data: PostBreakdownData = {
      voice: str(p.voice, 140),
      format: str(p.format, 100),
      hook: str(p.hook, 160),
      why: str(p.why, 320),
      fits: list(p.fits, 3, 160),
      misses: list(p.misses, 3, 160),
      sharpen: list(p.sharpen, 3, 160),
    };
    if (!data.why) continue;
    out.set(id, { fit: clampScore(p.fit), data });
  }
  return out;
}

/**
 * The model step on its own (no database): score `targets` against the brand.
 * Returns fit + breakdown per tweet id (posts the model skipped are absent).
 */
export async function scoreTweets(input: {
  handle: string;
  archetype: string | null;
  pillars: string[];
  summary: string | null;
  baseline: SocialDataTweet[];
  targets: SocialDataTweet[];
}): Promise<Map<string, { fit: number; data: PostBreakdownData }>> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Post analysis is unavailable right now.');
  const archetype =
    input.archetype && input.archetype !== 'unknown'
      ? (getArchetypeInfo(input.archetype)?.name ?? input.archetype)
      : null;
  const message = await new Anthropic({ apiKey }).messages.create({
    model: MODEL,
    max_tokens: 2400,
    thinking: { type: 'disabled' },
    messages: [{ role: 'user', content: buildPrompt({ ...input, archetype }) }],
  });
  const text = message.content[0]?.type === 'text' ? message.content[0].text : '';
  return parse(text, new Set(input.targets.map((t) => t.id)));
}

/**
 * Score the user's newest unscored original posts. Returns how many were
 * scored. Throws Error with a user-facing message on failure.
 */
export async function scoreLatestPosts(userId: string): Promise<{ scored: number }> {
  const x = await prisma.platformConnection.findFirst({
    where: { userId, platform: 'x', status: 'active' },
    select: { platformUserId: true, platformUsername: true },
  });
  if (!x) throw new Error('Connect your X account first.');

  const [{ tweets, error }, scan, done] = await Promise.all([
    fetchUserTweets(x.platformUserId, BASELINE + MAX_NEW + 10),
    prisma.brandScan.findFirst({
      where: { userId, status: 'active' },
      orderBy: { scannedAt: 'desc' },
      select: { archetype: true, contentPillars: true, summary: true },
    }),
    prisma.postScore.findMany({ where: { userId }, select: { tweetId: true } }),
  ]);
  if (error && !tweets.length)
    throw new Error('Could not read your posts right now. Try again shortly.');

  const originals = tweets.filter(isOriginal);
  const seen = new Set(done.map((d) => d.tweetId));
  const targets = originals.filter((t) => !seen.has(t.id)).slice(0, MAX_NEW);
  if (!targets.length) return { scored: 0 };

  const pillars = Array.isArray(scan?.contentPillars)
    ? (scan.contentPillars as unknown[])
        .filter((p): p is string => typeof p === 'string')
        .slice(0, 4)
    : [];
  const scores = await scoreTweets({
    handle: x.platformUsername,
    archetype: scan?.archetype ?? null,
    pillars,
    summary: scan?.summary ?? null,
    baseline: originals.slice(0, BASELINE),
    targets,
  });
  if (!scores.size) throw new Error('The analysis came back incomplete. Try again.');

  const base = median(originals.slice(0, BASELINE).map((t) => t.public_metrics.like_count));
  const rows = targets
    .filter((t) => scores.has(t.id))
    .map((t) => {
      const s = scores.get(t.id)!;
      return {
        userId,
        tweetId: t.id,
        excerpt: clean(t.text).slice(0, 280),
        postedAt: new Date(t.created_at),
        likes: t.public_metrics.like_count,
        replies: t.public_metrics.reply_count,
        reposts: t.public_metrics.retweet_count,
        views: t.public_metrics.impression_count ?? 0,
        multiple: base > 0 ? Math.round((t.public_metrics.like_count / base) * 10) / 10 : null,
        fit: s.fit,
        breakdown: s.data as unknown as object,
      };
    });
  const { count } = await prisma.postScore.createMany({ data: rows, skipDuplicates: true });
  return { scored: count };
}
