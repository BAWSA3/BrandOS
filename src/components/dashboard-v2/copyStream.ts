'use client';

/**
 * Stream from the copywriter (/api/dashboard/copywriter) — the same route,
 * auth, BotID, limits and prompt-safety for every format in the writing room.
 * Calls onText with the text so far; resolves with the full text.
 */
export type CopyMsg = { role: 'user' | 'assistant'; content: string };
export type CopyFormatOut = 'x-post' | 'thread' | 'outline' | 'article';

/** The route rejects a last message over 4,000 characters; keep well inside it. */
export const ASK_MAX = 3800;

export async function streamCopy({
  format,
  messages,
  signal,
  onText,
}: {
  format: CopyFormatOut;
  messages: CopyMsg[];
  signal?: AbortSignal;
  onText?: (soFar: string) => void;
}): Promise<string> {
  const res = await fetch('/api/dashboard/copywriter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      format,
      messages: messages.map((m) => ({ ...m, content: m.content.slice(0, ASK_MAX) })),
    }),
    signal,
  });
  if (!res.ok || !res.body) {
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(j.error || 'The copywriter is busy. Try again.');
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let out = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    out += dec.decode(value, { stream: true });
    onText?.(out);
  }
  if (!out.trim()) throw new Error('The draft came back empty. Try again.');
  return out;
}
