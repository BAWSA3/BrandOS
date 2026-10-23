'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { COLORWAY_TOKENS, type Colorway } from '@/lib/colorways';
import { DASH_FONTS } from '@/components/dashboard/dashFonts';

// The copywriter chat (/dashboard/write). Session-only: nothing is saved yet.
// Replies stream from /api/dashboard/copywriter; options come back separated
// by "---" lines and render as cards, each with its own Copy button.

type Format = 'x-post' | 'thread' | 'email' | 'ad' | 'other';
type Msg = { role: 'user' | 'assistant'; content: string };

const MONO = DASH_FONTS.mono;
const BLUE = '#0047FF';

const FORMATS: { id: Format; label: string; starters: string[] }[] = [
  {
    id: 'x-post',
    label: 'X post',
    starters: [
      'A post about what I shipped this week',
      'A hot take on my niche',
      'Announce a launch',
    ],
  },
  {
    id: 'thread',
    label: 'Thread',
    starters: ['A thread teaching my best lesson', 'Break down how I got my last result'],
  },
  {
    id: 'email',
    label: 'Email',
    starters: ['A newsletter intro for this week', 'A pitch email to a brand I want to work with'],
  },
  {
    id: 'ad',
    label: 'Ad',
    starters: ['Ad copy for my product', 'A promoted post for my newsletter'],
  },
  { id: 'other', label: 'Other', starters: ['Rewrite my X bio', 'A cold DM to a collaborator'] },
];

function splitOptions(text: string): { label: string | null; body: string }[] {
  return text
    .split(/^\s*---\s*$/m)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const m = s.match(/^(Option \d+)\s*\n/);
      return m ? { label: m[1], body: s.slice(m[0].length) } : { label: null, body: s };
    });
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          ?.writeText(text)
          .then(() => {
            setDone(true);
            setTimeout(() => setDone(false), 1400);
          })
          .catch(() => null);
      }}
      className="border px-2 py-1 text-[10px] uppercase tracking-[0.14em]"
      style={{ fontFamily: MONO, borderColor: 'var(--d-rule)', color: 'var(--d-muted)' }}
    >
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

/** Stand-in for the API in preview mode: streams `text` in small chunks. */
function demoStream(text: string): ReadableStream<Uint8Array> {
  const enc = new TextEncoder();
  let i = 0;
  return new ReadableStream({
    async pull(controller) {
      await new Promise((r) => setTimeout(r, 18));
      if (i >= text.length) return controller.close();
      controller.enqueue(enc.encode(text.slice(i, i + 6)));
      i += 6;
    },
  });
}

export default function CopywriterChat({
  handle,
  colorway,
  demoReply,
}: {
  handle: string | null;
  colorway: Colorway;
  /** Preview only (/world-preview/write): reply with this instead of calling the API. */
  demoReply?: string;
}) {
  const [format, setFormat] = useState<Format>('x-post');
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);
  useEffect(() => () => abortRef.current?.abort(), []);

  async function send(text: string) {
    const content = text.trim();
    if (!content || busy) return;
    setError(null);
    setInput('');
    const next: Msg[] = [...messages, { role: 'user', content }];
    setMessages([...next, { role: 'assistant', content: '' }]);
    setBusy(true);
    const ac = new AbortController();
    abortRef.current = ac;
    let out = '';
    try {
      const res = demoReply
        ? new Response(demoStream(demoReply))
        : await fetch('/api/dashboard/copywriter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ format, messages: next }),
            signal: ac.signal,
          });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || 'Something went wrong. Try again.');
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        out += dec.decode(value, { stream: true });
        setMessages([...next, { role: 'assistant', content: out }]);
      }
      if (!out.trim()) throw new Error('The draft came back empty. Try again.');
    } catch (e) {
      // Stopped: keep whatever streamed so far (or drop the empty reply).
      if ((e as Error).name === 'AbortError') {
        setMessages(out.trim() ? [...next, { role: 'assistant', content: out }] : messages);
        if (!out.trim()) setInput(content);
        return;
      }
      setError((e as Error).message);
      setInput(content);
      setMessages(messages);
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  const current = FORMATS.find((f) => f.id === format)!;

  return (
    <main
      className="flex min-h-screen flex-col"
      style={
        {
          ...COLORWAY_TOKENS[colorway],
          background: 'var(--d-canvas)',
          color: 'var(--d-ink)',
        } as React.CSSProperties
      }
    >
      <div className="mx-auto flex w-full max-w-[860px] flex-1 flex-col px-4 pb-4 pt-4 md:px-8">
        <header
          className="flex items-center justify-between gap-4"
          style={{ color: 'var(--d-head)' }}
        >
          <Link
            href="/dashboard"
            className="text-[11px] uppercase tracking-[0.16em]"
            style={{ fontFamily: MONO }}
          >
            ← Dashboard
          </Link>
          {handle && (
            <span
              className="text-[11px] uppercase tracking-[0.16em]"
              style={{ fontFamily: MONO, color: 'var(--d-head-muted)' }}
            >
              Writing as @{handle}
            </span>
          )}
        </header>

        <h1
          className="mt-8 leading-[0.9]"
          style={{
            fontFamily: DASH_FONTS.big,
            fontSize: 'clamp(40px, 7vw, 88px)',
            fontWeight: 500,
            letterSpacing: '-0.05em',
            color: 'var(--d-head)',
          }}
        >
          Write
        </h1>
        <p
          className="mt-3 max-w-[520px] text-[14px] leading-relaxed"
          style={{ color: 'var(--d-head-muted)' }}
        >
          Posts, threads, emails and ads in your voice, drafted from your brand scan and your
          best-performing posts.
        </p>

        <div
          className="mt-6 flex flex-wrap gap-2 border-y py-3"
          role="tablist"
          aria-label="Format"
          style={{ borderColor: 'var(--d-rule)' }}
        >
          {FORMATS.map((f) => {
            const on = f.id === format;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setFormat(f.id)}
                className="border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em]"
                style={{
                  fontFamily: MONO,
                  background: on ? BLUE : 'var(--d-tile)',
                  borderColor: on ? BLUE : 'var(--d-rule)',
                  color: on ? '#fff' : 'var(--d-ink)',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <section className="mt-6 flex flex-1 flex-col gap-4" aria-live="polite">
          {messages.length === 0 && (
            <div className="flex flex-col gap-2">
              <span
                className="text-[10px] uppercase tracking-[0.16em]"
                style={{ fontFamily: MONO, color: 'var(--d-head-muted)' }}
              >
                Try
              </span>
              <div className="flex flex-wrap gap-2">
                {current.starters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    className="border px-3 py-2 text-left text-[13px]"
                    style={{ background: 'var(--d-tile)', borderColor: 'var(--d-rule)' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) =>
            m.role === 'user' ? (
              <div
                key={i}
                className="ml-auto max-w-[85%] px-4 py-3 text-[14px] leading-relaxed text-white"
                style={{ background: BLUE, whiteSpace: 'pre-wrap' }}
              >
                {m.content}
              </div>
            ) : (
              <div key={i} className="flex max-w-full flex-col gap-2">
                {m.content === '' ? (
                  <span
                    className="text-[11px] uppercase tracking-[0.16em]"
                    style={{ fontFamily: MONO, color: 'var(--d-head-muted)' }}
                  >
                    Drafting…
                  </span>
                ) : (
                  splitOptions(m.content).map((opt, k) => (
                    <div
                      key={k}
                      className="border px-4 py-3"
                      style={{ background: 'var(--d-tile)', borderColor: 'var(--d-rule)' }}
                    >
                      {opt.label && (
                        <div
                          className="mb-2 text-[10px] uppercase tracking-[0.16em]"
                          style={{ fontFamily: MONO, color: 'var(--d-muted)' }}
                        >
                          {opt.label}
                        </div>
                      )}
                      <div
                        className="text-[14px] leading-relaxed"
                        style={{ whiteSpace: 'pre-wrap' }}
                      >
                        {opt.body}
                      </div>
                      {!(busy && i === messages.length - 1) && (
                        <div className="mt-3 flex justify-end">
                          <CopyButton text={opt.body} />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )
          )}
          {error && (
            <p className="text-[13px]" style={{ color: '#C2410C' }} role="alert">
              {error}
            </p>
          )}
          <div ref={endRef} />
        </section>

        <form
          className="sticky bottom-0 mt-6 flex items-end gap-2 border p-2"
          style={{ background: 'var(--d-tile)', borderColor: 'var(--d-rule)' }}
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={2}
            maxLength={4000}
            placeholder={`${current.label}: what should it say?`}
            aria-label="Message"
            className="min-h-[44px] flex-1 resize-none bg-transparent px-2 py-2 text-[14px] outline-none"
            style={{ color: 'var(--d-ink)', background: 'transparent' }}
          />
          {busy ? (
            <button
              type="button"
              onClick={() => abortRef.current?.abort()}
              className="border px-4 py-3 text-[11px] uppercase tracking-[0.14em]"
              style={{ fontFamily: MONO, borderColor: 'var(--d-rule)' }}
            >
              Stop
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="px-4 py-3 text-[11px] uppercase tracking-[0.14em] text-white disabled:opacity-50"
              style={{ fontFamily: MONO, background: BLUE }}
            >
              Write →
            </button>
          )}
        </form>
        {messages.length > 0 && !busy && (
          <button
            type="button"
            onClick={() => {
              setMessages([]);
              setError(null);
            }}
            className="mt-2 self-start text-[10px] uppercase tracking-[0.16em]"
            style={{ fontFamily: MONO, color: 'var(--d-head-muted)' }}
          >
            New chat
          </button>
        )}
      </div>
    </main>
  );
}
