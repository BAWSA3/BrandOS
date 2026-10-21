'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { DASH_FONTS } from '@/components/dashboard/dashFonts';
import Wordmark from '@/components/Wordmark';
import type { Idea } from '@/lib/brainstorm';

// The studio brainstorm (spec 2026-10-14). From a post's "Next time"
// suggestion, the 3D studio room becomes the workspace:
//   laptop    brainstorm: 4 new post ideas built on the suggestion (ideas, not drafts)
//   monitors  the ideas, one at a time: save to the board
//   art       the idea board: saved ideas, mark one "posted" (+XP)
// 'demo' (preview page) simulates the API with sample ideas.

const StudioRoom3D = dynamic(() => import('@/components/studio/StudioRoom3D'), { ssr: false });

const MONO = DASH_FONTS.mono;
const BIG = DASH_FONTS.big;
const BLUE = '#0047FF';
const INK = '#0E0E0E';
const MUTED = '#6B6862';
const RULE = 'rgba(14,14,14,0.12)';
const EASE = [0.16, 1, 0.3, 1] as const;

export interface SavedIdea extends Idea {
  id: string;
  suggestion: string;
  status: 'saved' | 'posted';
}

function Micro({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      className="text-[10px] uppercase tracking-[0.14em]"
      style={{ fontFamily: MONO, color: color ?? MUTED }}
    >
      {children}
    </div>
  );
}

export default function BrainstormStudio({
  mode,
  post,
  suggestions,
  initialIndex = 0,
  demoIdeas = [],
}: {
  mode: 'live' | 'demo';
  post: { id: string; excerpt: string; fit: number; url?: string };
  suggestions: string[];
  initialIndex?: number;
  demoIdeas?: Idea[];
}) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(
    Math.min(Math.max(0, initialIndex), Math.max(0, suggestions.length - 1))
  );
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [shown, setShown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [board, setBoard] = useState<SavedIdea[] | null>(null);
  const [boardOpen, setBoardOpen] = useState(false);
  const [boardSoon, setBoardSoon] = useState(false);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const suggestion = suggestions[index] ?? '';
  // ideas show on the room's monitors once the 3D room is up; until then (or on
  // phones, or without WebGL) the same card shows as a regular overlay
  const [roomReady, setRoomReady] = useState(false);
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const sync = () => setNarrow(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);
  const pinInRoom = roomReady && !narrow;
  const homeHref = mode === 'live' ? '/dashboard' : '/world-preview/dashboard?alert=0';

  const loadBoard = useCallback(async () => {
    if (mode === 'demo') return setBoard((b) => b ?? []);
    try {
      const res = await fetch('/api/dashboard/idea-board');
      const body = await res.json().catch(() => ({}));
      if (res.status === 503 && body.soon) {
        setBoardSoon(true);
        setBoard([]);
      } else setBoard(res.ok ? (body.ideas as SavedIdea[]) : []);
    } catch {
      setBoard([]);
    }
  }, [mode]);
  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const run = async () => {
    if (busy || !suggestion) return;
    setBusy(true);
    setNote(null);
    setIdeas([]);
    try {
      if (mode === 'demo') {
        await new Promise((r) => window.setTimeout(r, 1400));
        setIdeas(demoIdeas);
      } else {
        const res = await fetch('/api/dashboard/brainstorm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post.id, index }),
        });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !Array.isArray(body.ideas))
          setNote(body.error ?? 'Brainstorm failed. Try again.');
        else setIdeas(body.ideas as Idea[]);
      }
      setShown(0);
    } catch {
      setNote('Brainstorm failed. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const keyOf = (i: Idea) => `${index}:${i.title}`;
  const save = async (idea: Idea) => {
    if (savedKeys.has(keyOf(idea))) return;
    if (mode === 'demo') {
      setBoard((b) => [
        { ...idea, id: `demo-${Date.now()}`, suggestion, status: 'saved' },
        ...(b ?? []),
      ]);
      setSavedKeys((s) => new Set(s).add(keyOf(idea)));
      setNote('Saved to your idea board.');
      return;
    }
    const res = await fetch('/api/dashboard/idea-board', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        postScoreId: post.id,
        postExcerpt: post.excerpt,
        suggestion,
        idea,
      }),
    }).catch(() => null);
    const body = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok && body.idea) {
      setBoard((b) => [body.idea as SavedIdea, ...(b ?? [])]);
      setSavedKeys((s) => new Set(s).add(keyOf(idea)));
      setNote('Saved to your idea board.');
    } else if (res?.status === 503) {
      setBoardSoon(true);
      setNote('The idea board opens soon. Copy the idea for now.');
    } else setNote(body.error ?? 'Could not save that idea.');
  };

  const markPosted = async (id: string) => {
    if (mode !== 'demo') {
      const res = await fetch('/api/dashboard/idea-board', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'posted' }),
      }).catch(() => null);
      if (!res?.ok) return setNote('Could not update that idea.');
    }
    setBoard((b) => (b ?? []).map((i) => (i.id === id ? { ...i, status: 'posted' } : i)));
    setNote('Nice. +40 XP for posting it.');
  };

  const copy = async (idea: Idea) => {
    try {
      await navigator.clipboard.writeText(
        `${idea.title}\nHook: ${idea.hook}\nFormat: ${idea.format}`
      );
      setNote('Copied.');
    } catch {
      setNote('Copy failed. Select the text instead.');
    }
  };

  const current = ideas[shown];
  const monitorsPin = busy ? (
    <div
      className="whitespace-nowrap px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-white"
      style={{ fontFamily: MONO, background: INK }}
    >
      Thinking<span className="animate-pulse">_</span>
    </div>
  ) : current ? (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${index}-${shown}-${current.title}`}
        className="w-[280px] rounded-[10px] border bg-white p-4 text-left shadow-[0_18px_40px_rgba(0,0,0,0.18)]"
        style={{ borderColor: RULE, color: INK }}
        initial={reduce ? false : { opacity: 0, y: 10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? undefined : { opacity: 0, y: -8 }}
        transition={{ duration: 0.35, ease: EASE }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Micro color={BLUE}>
          Idea {shown + 1} / {ideas.length}
        </Micro>
        <div
          className="mt-2 text-[18px] leading-tight"
          style={{ fontFamily: BIG, fontWeight: 500 }}
        >
          {current.title}
        </div>
        <div className="mt-1">
          <Micro>{current.format}</Micro>
        </div>
        <div className="mt-2 text-[13px] leading-relaxed">
          <span style={{ color: MUTED }}>Hook: </span>
          {current.hook}
        </div>
        <div className="mt-1 text-[13px] leading-relaxed" style={{ color: MUTED }}>
          {current.why}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => void save(current)}
            disabled={savedKeys.has(keyOf(current))}
            className="px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-white disabled:opacity-60"
            style={{ fontFamily: MONO, background: BLUE }}
          >
            {savedKeys.has(keyOf(current)) ? 'Saved ✓' : 'Save to board'}
          </button>
          <button
            type="button"
            onClick={() => void copy(current)}
            className="border px-3 py-2 text-[10px] uppercase tracking-[0.14em]"
            style={{ fontFamily: MONO, borderColor: RULE }}
          >
            Copy
          </button>
          <div className="ml-auto flex gap-1">
            <button
              type="button"
              aria-label="Previous idea"
              onClick={() => setShown((s) => (s - 1 + ideas.length) % ideas.length)}
              className="border px-2 py-1 text-[12px]"
              style={{ borderColor: RULE, fontFamily: MONO }}
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next idea"
              onClick={() => setShown((s) => (s + 1) % ideas.length)}
              className="border px-2 py-1 text-[12px]"
              style={{ borderColor: RULE, fontFamily: MONO }}
            >
              ›
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  ) : null;

  const posted = (board ?? []).filter((i) => i.status === 'posted').length;

  return (
    <main
      className="relative h-screen w-full overflow-hidden"
      style={{ background: '#F2EFE8', color: INK }}
    >
      <StudioRoom3D
        spots={{
          laptop: {
            label: busy ? 'Brainstorming…' : 'Brainstorm ↗',
            onSelect: () => void run(),
            highlight: !ideas.length && !busy,
          },
          art: {
            label: `Idea board${board?.length ? ` · ${board.length}` : ''} ↗`,
            onSelect: () => setBoardOpen(true),
          },
        }}
        pins={monitorsPin && pinInRoom ? { monitors: monitorsPin } : undefined}
        onReady={() => setRoomReady(true)}
      />

      {/* fallback: the idea card as a regular overlay when it can't sit on the monitors */}
      {monitorsPin && !pinInRoom && (
        <div className="absolute bottom-16 left-1/2 z-10 -translate-x-1/2 md:bottom-20">
          {monitorsPin}
        </div>
      )}

      {/* the post + the suggestion being built on */}
      <motion.section
        className="absolute left-4 top-4 w-[min(380px,calc(100%-32px))] rounded-[10px] border bg-white/90 p-5 backdrop-blur"
        style={{ borderColor: RULE }}
        initial={reduce ? false : { opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
      >
        <div className="flex items-center justify-between">
          <Wordmark height={20} href={homeHref} />
          <Link
            href={homeHref}
            className="text-[10px] uppercase tracking-[0.14em] hover:underline"
            style={{ fontFamily: MONO }}
          >
            ← Dashboard
          </Link>
        </div>
        <div className="mt-4">
          <Micro>Studio · brainstorm</Micro>
        </div>
        <p className="mt-2 text-[14px] leading-relaxed">
          “{post.excerpt.slice(0, 140)}
          {post.excerpt.length > 140 ? '…' : ''}”
        </p>
        <div
          className="mt-1 text-[10px] uppercase tracking-[0.14em]"
          style={{ fontFamily: MONO, color: BLUE }}
        >
          Fit {post.fit}
        </div>

        <div className="mt-4 border-l-2 pl-3" style={{ borderColor: BLUE }}>
          <Micro color={BLUE}>Building on · next time</Micro>
          <ul className="mt-2 space-y-1.5">
            {suggestions.map((t, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => {
                    setIndex(i);
                    setIdeas([]);
                  }}
                  className="flex w-full gap-2 text-left text-[13px] leading-relaxed"
                  style={{ opacity: i === index ? 1 : 0.5 }}
                  aria-pressed={i === index}
                >
                  <span style={{ color: BLUE, fontFamily: MONO, fontSize: 11 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span>{t}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => void run()}
          disabled={busy || !suggestion}
          className="mt-5 w-full px-4 py-3 text-[11px] uppercase tracking-[0.14em] text-white disabled:opacity-60"
          style={{ fontFamily: MONO, background: BLUE }}
        >
          {busy
            ? 'Brainstorming…'
            : ideas.length
              ? 'Brainstorm again'
              : 'Brainstorm ideas (or click the laptop)'}
        </button>
        <button
          type="button"
          onClick={() => setBoardOpen(true)}
          className="mt-2 w-full border px-4 py-2.5 text-[11px] uppercase tracking-[0.14em]"
          style={{ fontFamily: MONO, borderColor: RULE }}
        >
          Idea board{board?.length ? ` · ${board.length}` : ''} (or click the art)
        </button>
        <AnimatePresence>
          {note && (
            <motion.div
              key={note}
              className="mt-3 text-[12px]"
              style={{ color: MUTED }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="status"
            >
              {note}
            </motion.div>
          )}
        </AnimatePresence>
        <div
          className="mt-4 text-[10px] uppercase tracking-[0.14em]"
          style={{ fontFamily: MONO, color: MUTED }}
        >
          Ideas, not drafts · you write the post
        </div>
      </motion.section>

      {/* the idea board (the art on the wall) */}
      <AnimatePresence>
        {boardOpen && (
          <motion.aside
            key="board"
            className="absolute bottom-4 right-4 top-4 flex w-[min(380px,calc(100%-32px))] flex-col rounded-[10px] border bg-white p-5"
            style={{ borderColor: RULE }}
            initial={reduce ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: 24 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            <div className="flex items-center justify-between">
              <Micro color={BLUE}>Idea board</Micro>
              <button
                type="button"
                onClick={() => setBoardOpen(false)}
                className="text-[10px] uppercase tracking-[0.14em]"
                style={{ fontFamily: MONO }}
              >
                Close ×
              </button>
            </div>
            <div className="mt-1 text-[12px]" style={{ color: MUTED }}>
              {boardSoon
                ? 'The idea board opens soon. Copy ideas for now.'
                : `${board?.length ?? 0} saved · ${posted} posted`}
            </div>
            <ul className="mt-4 flex-1 space-y-3 overflow-y-auto">
              {(board ?? []).map((i) => (
                <li key={i.id} className="rounded-[8px] border p-3" style={{ borderColor: RULE }}>
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="text-[15px] leading-snug"
                      style={{ fontFamily: BIG, fontWeight: 500 }}
                    >
                      {i.title}
                    </div>
                    <Micro color={i.status === 'posted' ? BLUE : MUTED}>
                      {i.status === 'posted' ? 'Posted ✓' : i.format}
                    </Micro>
                  </div>
                  <div className="mt-1 text-[12px] leading-relaxed" style={{ color: MUTED }}>
                    Hook: {i.hook}
                  </div>
                  {i.status === 'saved' && (
                    <button
                      type="button"
                      onClick={() => void markPosted(i.id)}
                      className="mt-2 border px-2 py-1 text-[10px] uppercase tracking-[0.14em]"
                      style={{ fontFamily: MONO, borderColor: BLUE, color: BLUE }}
                    >
                      I posted this · +40 XP
                    </button>
                  )}
                </li>
              ))}
              {board && !board.length && !boardSoon && (
                <li className="text-[13px]" style={{ color: MUTED }}>
                  Nothing saved yet. Brainstorm on the laptop, then save the ideas you like.
                </li>
              )}
            </ul>
          </motion.aside>
        )}
      </AnimatePresence>

      <div
        className="pointer-events-none absolute bottom-5 left-1/2 hidden -translate-x-1/2 text-[10px] uppercase tracking-[0.16em] md:block"
        style={{ fontFamily: MONO, color: MUTED }}
      >
        Laptop = brainstorm · screens = ideas · art = idea board · drag to rotate
      </div>
    </main>
  );
}
