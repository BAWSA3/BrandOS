import { z } from 'zod';
import { computeBrandScore } from '@/lib/brand-score';
import { analyzePost, parsePostId, postCard, renderPostAnalysis } from '@/lib/post-analysis';
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
import { freshRead, profileCard, renderProfileRead, storedRead } from '@/lib/mcp/profile-read';
import { CARD_URI, cardHtml } from '@/lib/mcp/card-html';

// BrandOS MCP tools, for signed-in BrandOS accounts (sign-in: src/lib/mcp/auth.ts,
// weekly allowance: src/lib/mcp/usage.ts). BrandOS reads taste and brand focus:
//   analyze_post     an X post link -> voice, format, structure; the profile
//                    behind it; why the post correlates with their brand
//   analyze_profile  an X handle -> brand score + archetype
// AI suggests; it never rewrites anyone's posts.

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';
const HANDLE_RE = /^@?[A-Za-z0-9_]{1,15}$/;
const HOUR = 60 * 60 * 1000;
// Burst ceilings on top of the weekly allowance: per account and global.
const PER_USER = { interval: HOUR, maxRequests: 30 };
const GLOBAL = { interval: HOUR, maxRequests: 400 };

type ToolResult = {
  content: { type: 'text'; text: string }[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

// MCP Apps: both tools render the BrandOS card (src/lib/mcp/card-html.ts) in
// hosts that support it; the text stays for the model and for hosts that don't.
const CARD_META = {
  ui: { resourceUri: CARD_URI },
  'ui/resourceUri': CARD_URI,
  'openai/outputTemplate': CARD_URI,
};
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
  fresh: boolean,
  card?: Record<string, unknown>
): Promise<ToolResult> {
  if (fresh && g.allow.kind === 'metered') await recordUse(g.account.id, tool);
  const line = allowanceLine(g.allow, fresh);
  return {
    content: [
      {
        type: 'text',
        text: `${body}\n\n${line}${card ? "\n\n(Shown to the user as a BrandOS card above. Add at most a one-line takeaway; don't repeat the breakdown.)" : ''}`,
      },
    ],
    ...(card ? { structuredContent: { ...card, allowance: line } } : {}),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the SDK's server type is generic over transports
export function registerBrandTools(server: any, origin: string) {
  server.registerResource(
    'brandos-card',
    CARD_URI,
    {
      title: 'BrandOS card',
      description: 'The BrandOS brand / post breakdown card',
      mimeType: 'text/html;profile=mcp-app',
      _meta: { ui: { prefersBorder: false } },
    },
    async (uri: URL) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/html;profile=mcp-app',
          text: await cardHtml(),
          _meta: { ui: { prefersBorder: false } },
        },
      ],
    })
  );

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
      _meta: CARD_META,
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
        return finish(g, 'analyze_post', renderPostAnalysis(a), a.fresh, postCard(a));
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
        'Full BrandOS brand read of a public X (Twitter) handle: brand score (0-100), archetype, a short ' +
        'assessment, the four phase scores (Define, Check, Generate, Scale), content pillars, what is working, ' +
        'what is holding it back, and three next moves. Present it as given.',
      inputSchema: z.object({ handle: z.string().max(20).describe('X handle, with or without @') }),
      _meta: CARD_META,
    },
    async ({ handle }: { handle: string }, ctx: HandlerCtx): Promise<ToolResult> => {
      if (!HANDLE_RE.test(handle)) return text('That is not a valid X handle.', true);
      const g = await gate('analyze_profile', ctx);
      if (!g.ok) return g.result;
      const clean = handle.replace(/^@/, '').toLowerCase();

      // A stored full read answers for free (no scan, not metered).
      const stored = await storedRead(clean, g.account.id);
      if (stored)
        return finish(g, 'analyze_profile', renderProfileRead(stored), false, profileCard(stored));

      const result = await computeBrandScore(clean, origin);
      if (result.status !== 200) {
        return text(
          result.status === 404
            ? `Couldn't find @${clean} on X.`
            : 'The scan failed. Try again shortly.',
          true
        );
      }
      const brandScore = (result.body.brandScore ?? {}) as Record<string, unknown>;
      const read = freshRead(clean, brandScore);
      return finish(g, 'analyze_profile', renderProfileRead(read), true, profileCard(read));
    }
  );
}
