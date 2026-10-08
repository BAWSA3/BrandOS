import { z } from 'zod';
import prisma from '@/lib/db';
import { computeBrandScore } from '@/lib/brand-score';
import { analyzePost, parsePostId, renderPostAnalysis } from '@/lib/post-analysis';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';

// BrandOS MCP tools (v1, no key needed). BrandOS reads taste and brand focus:
//   analyze_post     an X post link -> voice, format, structure; the profile
//                    behind it; why the post correlates with their brand
//   analyze_profile  an X handle -> brand score + archetype
// AI suggests; it never rewrites anyone's posts.

const SITE = 'https://mybrandos.app';
const HANDLE_RE = /^@?[A-Za-z0-9_]{1,15}$/;
const RECENT_SCAN_DAYS = 7;
const HOUR = 60 * 60 * 1000;
// Each fresh analysis costs model + data calls: per-IP and global ceilings.
const PER_IP = { interval: HOUR, maxRequests: 10 };
const GLOBAL = { interval: HOUR, maxRequests: 400 };

type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean };
const text = (t: string, isError = false): ToolResult => ({
  content: [{ type: 'text', text: t }],
  ...(isError ? { isError } : {}),
});

interface HandlerCtx {
  http?: { req?: Request };
}

/** Null when allowed; otherwise the message to return. */
function overLimit(tool: string, ctx: HandlerCtx): string | null {
  const ip = ctx.http?.req ? getClientIdentifier(ctx.http.req) : 'unknown';
  if (checkRateLimit(`mcp:${tool}:${ip}`, PER_IP).limited) {
    return `You've hit the hourly limit. Try again later, or get your full brand read at ${SITE}.`;
  }
  if (checkRateLimit(`mcp:${tool}:global`, GLOBAL).limited) {
    return `BrandOS is busy right now. Try again shortly, or visit ${SITE}.`;
  }
  return null;
}

function profileSummary(
  handle: string,
  score: number,
  archetype: string | null,
  cached: boolean
): string {
  const info = archetype ? getArchetypeInfo(archetype) : null;
  return [
    `@${handle} · BrandOS score ${score}/100${info ? ` · ${info.name}: ${info.tagline}` : ''}`,
    cached ? '(from a scan in the last 7 days)' : '(fresh scan)',
    '',
    `Brand card: ${SITE}/scan/${handle}?s=${score}${archetype ? `&a=${encodeURIComponent(archetype)}` : ''}`,
    `Paste any of their post links into analyze_post for a taste and brand breakdown.`,
  ].join('\n');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the SDK's server type is generic over transports
export function registerBrandTools(server: any, origin: string) {
  server.registerTool(
    'analyze_post',
    {
      title: 'Analyze an X post',
      description:
        'BrandOS brand breakdown of an X (Twitter) post: its voice, format, structure and taste signals; ' +
        'the profile behind it (brand focus, pillars, taste); and why this post correlates with their brand, ' +
        'with an on-brand fit score and two ways to sharpen it. Input: the post link.',
      inputSchema: z.object({
        url: z.string().max(300).describe('Link to the X post, e.g. https://x.com/name/status/123'),
      }),
    },
    async ({ url }: { url: string }, ctx: HandlerCtx): Promise<ToolResult> => {
      if (!parsePostId(url))
        return text(
          'That is not an X post link. Paste a link like https://x.com/name/status/123.',
          true
        );
      const limited = overLimit('post', ctx);
      if (limited) return text(limited, true);
      try {
        return text(renderPostAnalysis(await analyzePost(url)));
      } catch (error) {
        const msg =
          error instanceof Error ? error.message : 'The analysis failed. Try again shortly.';
        if (!(error instanceof Error)) console.error('[mcp] analyze_post failed:', error);
        return text(msg, true);
      }
    }
  );

  server.registerTool(
    'analyze_profile',
    {
      title: 'Analyze an X profile',
      description:
        'BrandOS brand score (0-100) and creator archetype for a public X (Twitter) handle, with a link to the brand card.',
      inputSchema: z.object({ handle: z.string().max(20).describe('X handle, with or without @') }),
    },
    async ({ handle }: { handle: string }, ctx: HandlerCtx): Promise<ToolResult> => {
      if (!HANDLE_RE.test(handle)) return text('That is not a valid X handle.', true);
      const clean = handle.replace(/^@/, '').toLowerCase();

      // A recent scan answers for free (no model call).
      const since = new Date(Date.now() - RECENT_SCAN_DAYS * 24 * HOUR);
      const recent = await prisma.brandScans.findFirst({
        where: { username: { equals: clean, mode: 'insensitive' }, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        select: { score: true, archetype: true },
      });
      if (recent) return text(profileSummary(clean, recent.score, recent.archetype, true));

      const limited = overLimit('profile', ctx);
      if (limited) return text(limited, true);

      const result = await computeBrandScore(clean, origin);
      if (result.status !== 200) {
        return text(
          result.status === 404
            ? `Couldn't find @${clean} on X.`
            : 'The scan failed. Try again shortly.',
          true
        );
      }
      const brandScore = result.body.brandScore as
        | { overallScore?: number; archetype?: { primary?: string } }
        | undefined;
      return text(
        profileSummary(
          clean,
          Math.round(brandScore?.overallScore ?? 0),
          brandScore?.archetype?.primary ?? null,
          false
        )
      );
    }
  );
}
