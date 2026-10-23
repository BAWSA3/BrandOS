import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getCurrentUser } from '@/lib/auth';
import { hasPro, PRO_REQUIRED } from '@/lib/billing';
import { botGuard } from '@/lib/botid-guard';
import { checkRateLimit, rateLimiters, withRateLimit } from '@/lib/rate-limit';
import { sanitizeUntrusted } from '@/lib/prompt-safety';
import { buildCopywriterPrompt, copyBrandForUser, isCopyFormat } from '@/lib/copywriter';

/**
 * POST /api/dashboard/copywriter { format, messages: [{role, content}] }
 * The copywriter chat (/dashboard/write). Streams plain text back.
 * AI cost surface: BotID + the per-IP AI limit + 60 messages per hour per
 * user, bounded history and input. The brand context comes from the user's
 * own scan (server-side); only the conversation comes from the client.
 */
export const maxDuration = 60;

const MODEL = 'claude-sonnet-5';
const MAX_BODY_BYTES = 120_000;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_HISTORY_MESSAGES = 20;
const MAX_HISTORY_CHARS = 6_000;

type ChatMessage = { role: 'user' | 'assistant'; content: string };

function isChatMessage(m: unknown): m is ChatMessage {
  if (typeof m !== 'object' || m === null) return false;
  const r = m as Record<string, unknown>;
  return (r.role === 'user' || r.role === 'assistant') && typeof r.content === 'string';
}

async function handlePost(request: NextRequest) {
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in to write' }, { status: 401 });
  if (!hasPro(user)) return NextResponse.json(PRO_REQUIRED, { status: 402 });
  if (
    checkRateLimit(`copywriter:${user.id}`, { interval: 60 * 60 * 1000, maxRequests: 60 }).limited
  )
    return NextResponse.json(
      { error: 'That is a lot of drafts for one hour. Try again soon.' },
      { status: 429 }
    );

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES)
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const format = isCopyFormat(body.format) ? body.format : 'other';
  const all = Array.isArray(body.messages) ? body.messages.filter(isChatMessage) : [];
  const last = all[all.length - 1];
  if (!last || last.role !== 'user' || !last.content.trim())
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  if (last.content.length > MAX_MESSAGE_CHARS)
    return NextResponse.json(
      { error: `Message too long (max ${MAX_MESSAGE_CHARS} characters)` },
      { status: 400 }
    );

  // Bounded history; must open on a user turn for the Messages API.
  const messages = all
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({
      role: m.role,
      content: sanitizeUntrusted(m.content).slice(0, MAX_HISTORY_CHARS),
    }))
    .filter((m) => m.content.length > 0);
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length) return NextResponse.json({ error: 'Message is required' }, { status: 400 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey)
    return NextResponse.json({ error: 'Writing is unavailable right now.' }, { status: 503 });

  const handle =
    user.platformConnections.find((pc) => pc.platform === 'x')?.platformUsername ??
    user.xUsername ??
    user.name ??
    'you';
  const brand = await copyBrandForUser(user.id, handle.replace(/^@/, ''));
  const system = buildCopywriterPrompt(brand, format);

  const stream = new Anthropic({ apiKey }).messages.stream({
    model: MODEL,
    max_tokens: 2000,
    // Sonnet 5 defaults to adaptive thinking — keep the budget for the copy.
    thinking: { type: 'disabled' },
    system,
    messages,
  });

  const encoder = new TextEncoder();
  const body$ = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta')
            controller.enqueue(encoder.encode(event.delta.text));
        }
      } catch (e) {
        console.error('[copywriter] stream failed:', e);
        // Never echo internal error text; the client shows this inline.
        controller.enqueue(encoder.encode('\n\n[The draft was cut off. Try again.]'));
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body$, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export const POST = withRateLimit(handlePost, rateLimiters.ai);
