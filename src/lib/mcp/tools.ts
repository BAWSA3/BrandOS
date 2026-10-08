import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import prisma from '@/lib/db';
import { computeBrandScore } from '@/lib/brand-score';
import { loadCurrentBrand } from '@/lib/brand-context';
import { fenceDraft, MAX_CONTENT_CHARS, runBrandCheck } from '@/lib/content-check';
import { checkAndIncrementUsage } from '@/lib/usage';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import type { McpAuthExtra } from '@/lib/mcp/auth';

// BrandOS MCP tools (v1). AI gives context and checks; it never ghostwrites.
//   scan_brand        free, no key: score + archetype for an X handle
//   get_brand_context key: the user's brand rules, to keep an AI on brand
//   check_draft       key: score a draft against the user's brand (uses check quota)

const SITE = 'https://mybrandos.app';
const HANDLE_RE = /^@?[A-Za-z0-9_]{1,15}$/;
const RECENT_SCAN_DAYS = 7;
// Anonymous scans cost a model call: per-IP and global ceilings.
const SCAN_PER_IP = { interval: 60 * 60 * 1000, maxRequests: 5 };
const SCAN_GLOBAL_PER_HOUR = { interval: 60 * 60 * 1000, maxRequests: 300 };
const TOOL_PER_KEY = { interval: 60 * 1000, maxRequests: 20 };

type ToolResult = { content: { type: 'text'; text: string }[]; isError?: boolean };
const text = (t: string, isError = false): ToolResult => ({
  content: [{ type: 'text', text: t }],
  ...(isError ? { isError } : {}),
});

interface HandlerCtx {
  http?: { req?: Request; authInfo?: { extra?: Record<string, unknown> } };
}

function authOf(ctx: HandlerCtx): McpAuthExtra | null {
  const extra = ctx.http?.authInfo?.extra as McpAuthExtra | undefined;
  return extra?.userId ? extra : null;
}

const NEEDS_KEY =
  `This tool needs your BrandOS key. Create one at ${SITE}/connect and add it to your MCP client ` +
  'as a bearer token (Authorization: Bearer bos_...).';

function scanSummary(
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
    `See the brand card: ${SITE}/scan/${handle}?s=${score}${archetype ? `&a=${encodeURIComponent(archetype)}` : ''}`,
    `Scan your own: ${SITE}`,
  ].join('\n');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the SDK's server type is generic over transports
export function registerBrandTools(server: any, origin: string) {
  server.registerTool(
    'scan_brand',
    {
      title: 'Scan an X brand',
      description:
        'Get the BrandOS brand score (0-100) and creator archetype for a public X (Twitter) handle. ' +
        'Free, no key needed. Returns a link to the full breakdown.',
      inputSchema: z.object({ handle: z.string().describe('X handle, with or without @') }),
    },
    async ({ handle }: { handle: string }, ctx: HandlerCtx): Promise<ToolResult> => {
      if (!HANDLE_RE.test(handle)) return text('That is not a valid X handle.', true);
      const clean = handle.replace(/^@/, '').toLowerCase();

      // A recent scan answers for free (no model call).
      const since = new Date(Date.now() - RECENT_SCAN_DAYS * 24 * 60 * 60 * 1000);
      const recent = await prisma.brandScans.findFirst({
        where: { username: { equals: clean, mode: 'insensitive' }, createdAt: { gte: since } },
        orderBy: { createdAt: 'desc' },
        select: { score: true, archetype: true },
      });
      if (recent) return text(scanSummary(clean, recent.score, recent.archetype, true));

      const ip = ctx.http?.req ? getClientIdentifier(ctx.http.req) : 'unknown';
      if (checkRateLimit(`mcp-scan:${ip}`, SCAN_PER_IP).limited) {
        return text(`Scan limit reached for now. Try again later, or scan at ${SITE}.`, true);
      }
      if (checkRateLimit('mcp-scan:global', SCAN_GLOBAL_PER_HOUR).limited) {
        return text(`BrandOS is busy right now. Scan at ${SITE} instead.`, true);
      }

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
        scanSummary(
          clean,
          Math.round(brandScore?.overallScore ?? 0),
          brandScore?.archetype?.primary ?? null,
          false
        )
      );
    }
  );

  server.registerTool(
    'get_brand_context',
    {
      title: 'Get my brand context',
      description:
        "The signed-in user's brand: voice, tone, keywords, do/don't rules, palette and voice samples. " +
        'Use it as context so your suggestions stay on brand; the user writes the final words.',
      inputSchema: z.object({}),
    },
    async (_args: Record<string, never>, ctx: HandlerCtx): Promise<ToolResult> => {
      const auth = authOf(ctx);
      if (!auth) return text(NEEDS_KEY, true);
      if (checkRateLimit(`mcp-key:${auth.apiKeyId}`, TOOL_PER_KEY).limited)
        return text('Slow down a little and try again.', true);

      const brand = await loadCurrentBrand(auth.userId, auth.workspaceId);
      if (!brand) return text(`No brand set up yet. Build yours at ${SITE}/studio.`, true);
      // Archetype from the user's latest scan of their own handle.
      const user = await prisma.user.findUnique({
        where: { id: auth.userId },
        select: { xUsername: true },
      });
      const handle = user?.xUsername?.replace(/^@/, '');
      const scan = handle
        ? await prisma.brandScans.findFirst({
            where: { username: { equals: handle, mode: 'insensitive' }, archetype: { not: null } },
            orderBy: { createdAt: 'desc' },
            select: { archetype: true },
          })
        : null;

      return text(
        JSON.stringify(
          {
            brand: brand.name,
            archetype: scan?.archetype ?? null,
            tone: brand.tone,
            keywords: brand.keywords,
            do: brand.doPatterns,
            dont: brand.dontPatterns,
            palette: brand.colors,
            voiceSamples: brand.voiceSamples.slice(0, 5).map((v) => v.slice(0, 500)),
            guidance:
              'Suggest and check; do not ghostwrite. Keep the user in charge of the final words.',
          },
          null,
          2
        )
      );
    }
  );

  server.registerTool(
    'check_draft',
    {
      title: 'Check a draft against my brand',
      description:
        "Score a draft post (0-100) against the signed-in user's brand, with issues, strengths and " +
        'suggestions. Uses one Content Check from their plan.',
      inputSchema: z.object({
        draft: z.string().min(1).max(MAX_CONTENT_CHARS).describe('The draft text to check'),
      }),
    },
    async ({ draft }: { draft: string }, ctx: HandlerCtx): Promise<ToolResult> => {
      const auth = authOf(ctx);
      if (!auth) return text(NEEDS_KEY, true);
      if (checkRateLimit(`mcp-key:${auth.apiKeyId}`, TOOL_PER_KEY).limited)
        return text('Slow down a little and try again.', true);

      const brand = await loadCurrentBrand(auth.userId, auth.workspaceId);
      if (!brand) return text(`No brand set up yet. Build yours at ${SITE}/studio.`, true);

      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) return text('Content Check is unavailable right now.', true);

      const { allowed } = await checkAndIncrementUsage(auth.userId, 'check');
      if (!allowed)
        return text(`You've used this month's Content Checks. More at ${SITE}/pricing.`, true);

      const result = await runBrandCheck(
        new Anthropic({ apiKey }),
        brand,
        fenceDraft(draft.trim())
      );
      if (!result) return text('The check returned an invalid result. Try again.', true);

      return text(
        JSON.stringify(
          {
            score: result.score,
            issues: result.issues,
            strengths: result.strengths,
            suggestions: result.suggestions,
            note: 'Suggestions only; the user decides what to change.',
          },
          null,
          2
        )
      );
    }
  );
}
