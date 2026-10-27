import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import prisma from '@/lib/db';
import { isAdminRequest } from '@/lib/admin-auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { buildChatSystem, memberContext, SUPPORT_MODEL } from '@/lib/support-agent';

/**
 * POST /api/admin/support/:id/chat { messages: [{role, content}], draft? }
 * The admin's chat with the support agent about one thread. Streams plain
 * text; a full replacement reply comes wrapped in <draft>…</draft>. The
 * thread (incl. the member's untrusted messages) is read server-side.
 */
export const maxDuration = 60;

const MAX_BODY_BYTES = 120_000;
const MAX_MESSAGE_CHARS = 4_000;
const MAX_HISTORY_MESSAGES = 20;
const MAX_DRAFT_CHARS = 8_000;

type ChatMessage = { role: 'user' | 'assistant'; content: string };

function isChatMessage(m: unknown): m is ChatMessage {
  if (typeof m !== 'object' || m === null) return false;
  const r = m as Record<string, unknown>;
  return (r.role === 'user' || r.role === 'assistant') && typeof r.content === 'string';
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request)))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (checkRateLimit('support-chat', { interval: 60 * 60 * 1000, maxRequests: 200 }).limited)
    return NextResponse.json({ error: 'Too many messages this hour.' }, { status: 429 });
  const { id } = await params;

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES)
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const all = Array.isArray(body.messages) ? body.messages.filter(isChatMessage) : [];
  const last = all[all.length - 1];
  if (!last || last.role !== 'user' || !last.content.trim())
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  const messages = all
    .slice(-MAX_HISTORY_MESSAGES)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }))
    .filter((m) => m.content.trim().length > 0);
  while (messages.length && messages[0].role !== 'user') messages.shift();
  if (!messages.length) return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  const draft = typeof body.draft === 'string' ? body.draft.slice(0, MAX_DRAFT_CHARS) : null;

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'The agent is unavailable.' }, { status: 503 });

  const thread = await prisma.supportThread.findUnique({
    where: { id },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });
  if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const member = await memberContext(thread.userId, thread.email).catch(() => null);

  const stream = new Anthropic({ apiKey }).messages.stream({
    model: SUPPORT_MODEL,
    max_tokens: 1500,
    thinking: { type: 'disabled' },
    system: buildChatSystem(thread, member, draft),
    messages,
  });

  const encoder = new TextEncoder();
  const out = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta')
            controller.enqueue(encoder.encode(event.delta.text));
        }
      } catch (e) {
        console.error('[support-chat] stream failed:', e);
        controller.enqueue(encoder.encode('\n\n[The answer was cut off. Try again.]'));
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(out, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}
