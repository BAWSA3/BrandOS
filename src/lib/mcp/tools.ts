import { z } from 'zod';
import prisma from '@/lib/db';
import { computeBrandScore } from '@/lib/brand-score';
import { analyzePost, brandLink, parsePostId, renderPostAnalysis } from '@/lib/post-analysis';
import { checkRateLimit } from '@/lib/rate-limit';
import type { McpAuthExtra } from '@/lib/mcp/auth';
import {
  allowance,
  allowanceLine,
  limitReached,
  recordUse,
  type Allowance,
  type McpAccount,
} from '@/lib/mcp/usage';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';

// BrandOS MCP tools, for signed-in BrandOS accounts (sign-in: src/lib/mcp/auth.ts,
// weekly allowance: src/lib/mcp/usage.ts). BrandOS reads taste and brand focus:
//   analyze_post     an X post link -> voice, format, structure; the profile
//                    behind it; why the post correlates with their brand
//   analyze_profile  an X handle -> brand score + archetype
// AI suggests; it never rewrites anyone's posts.

const SITE = 'https://mybrandos.app';
const HANDLE_RE = /^@?[A-Za-z0-9_]{1,15}$/;
const RECENT_SCAN_DAYS = 7;
const HOUR = 60 * 60 * 1000;
// Burst ceilings on top of the weekly allowance: per account and global.
const PER_USER = { interval: HOUR, maxRequests: 30 };
const GLOBAL = { interval: HOUR, maxRequests: 400 };

type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean };
const text = (t: string, isError = false): ToolResult => ({
  content: [{ type: 'text', text: t }],
  ...(isError ? { isError } : {}),
});

interface HandlerCtx {
  http?: { req?: Request; authInfo?: { extra?: McpAuthExtra } };
}

type Gate = { ok: false; result: ToolResult } | { ok: true; account: McpAccount; allow: Allowance };

/**
 * Every tool call: a BrandOS account (the OAuth sign-in guarantees a token),
 * the weekly allowance, and an hourly burst ceiling per account + global.
 */
async function gate(tool: string, ctx: HandlerCtx): Promise<Gate> {
  const account = ctx.http?.authInfo?.extra?.account ?? null;
  if (!account) {
    return {
      ok: false,
      result: text(
        `Finish creating your BrandOS account first: ${SITE}/signup?utm_source=mcp. Then try again here.`,
        true
      ),
    };
  }
  const allow = await allowance(account);
  if (allow.kind === 'metered' && allow.left <= 0) {
    return { ok: false, result: text(limitReached(allow, SITE), true) };
  }
  if (checkRateLimit(`mcp:${tool}:${account.id}`, PER_USER).limited) {
    return { ok: false, result: text('Slow down a little: try again in a few minutes.', true) };
  }
  if (checkRateLimit(`mcp:${tool}:global`, GLOBAL).limited) {
    return { ok: false, result: text(`BrandOS is busy right now. Try again shortly.`, true) };
  }
  return { ok: true, account, allow };
}

/** Count the use (only when fresh work happened) and add the allowance line. */
async function finish(
  g: Extract<Gate, { ok: true }>,
  tool: string,
  body: string,
  fresh: boolean
): Promise<ToolResult> {
  if (fresh && g.allow.kind === 'metered') await recordUse(g.account.id, tool);
  return text(`${body}\n\n${allowanceLine(g.allow, fresh)}`);
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
    `Open @${handle}'s full brand dashboard: ${brandLink(handle, 'analyze_profile')}`,
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
        'BrandOS brand breakdown of an X (Twitter) post, judged against the author’s brand (their BrandOS ' +
        'scan): an on-brand fit score and why, voice, format and hook, what fit, what drifted, and what to ' +
        'try next time. The same read as the BrandOS dashboard. Input: the post link.',
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
      const g = await gate('analyze_post', ctx);
      if (!g.ok) return g.result;
      try {
        const a = await analyzePost(url, g.account.id);
        return finish(g, 'analyze_post', renderPostAnalysis(a), a.fresh);
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
      const g = await gate('analyze_profile', ctx);
      if (!g.ok) return g.result;
      const clean = handle.replace(/^@/, '').toLowerCase();

      // A recent scan answers for free (no model call).
      const since = new Date(Date.now() - RECENT_SCAN_DAYS * 24 * HOUR);
      const recent = await prisma.brandScans.findFirst({
        where: { username: { equals: clean, mode: 'insensitive' }, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        select: { score: true, archetype: true },
      });
      if (recent)
        return finish(
          g,
          'analyze_profile',
          profileSummary(clean, recent.score, recent.archetype, true),
          false
        );

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
      return finish(
        g,
        'analyze_profile',
        profileSummary(
          clean,
          Math.round(brandScore?.overallScore ?? 0),
          brandScore?.archetype?.primary ?? null,
          false
        ),
        true
      );
    }
  );
}
