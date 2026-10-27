'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useV2 } from './context';
import { CARDS, FRAMES, LINKS, type CanvasCard } from './sample';
import { Btn, DISPLAY, Kbd, Label, MockNote, VCR } from './ui';

/**
 * The spatial canvas. Desktop: an infinite-feeling board (dot grid) where
 * ideas, posts and concepts are cards you drag, group in frames and connect.
 * Phone: the same board as a stack of frames; long-press a card to connect it.
 * Opens with a suggestion from the Record, never an empty board.
 *
 * Keys: N new card · C connect · Delete remove (with undo) · ⌘Z undo · Esc deselect.
 * Motion: cards lift on drag (shadow + 1.02); the suggested card is the only Klein edge.
 */

const W = 200;

function center(c: CanvasCard) {
  return { x: c.x + W / 2, y: c.y + 44 };
}

export default function Canvas() {
  const { go, toast } = useV2();
  const reduce = useReducedMotion();
  const [cards, setCards] = useState(CARDS);
  const [links, setLinks] = useState(LINKS);
  const [sel, setSel] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null);
  const [history, setHistory] = useState<{ cards: CanvasCard[]; links: [string, string][] }[]>([]);
  const board = useRef<HTMLDivElement>(null);

  const snapshot = useCallback(() => {
    setHistory((h) => [...h.slice(-29), { cards, links }]);
  }, [cards, links]);
  const undo = useCallback(() => {
    const last = history.at(-1);
    if (!last) return;
    setHistory(history.slice(0, -1));
    setCards(last.cards);
    setLinks(last.links);
  }, [history]);

  const addCard = useCallback(() => {
    snapshot();
    const id = `n${Date.now()}`;
    setCards((cs) => [
      ...cs,
      { id, x: 420, y: 470, text: 'New idea. Write it the way you would post it.', tag: 'Idea' },
    ]);
    setSel(id);
  }, [snapshot]);

  const remove = useCallback(
    (id: string) => {
      snapshot();
      setCards((cs) => cs.filter((c) => c.id !== id));
      setLinks((ls) => ls.filter(([a, b]) => a !== id && b !== id));
      setSel(null);
      toast('Card removed.', undo);
    },
    [snapshot, toast, undo]
  );

  const connect = (from: string, to: string) => {
    if (from === to) return;
    snapshot();
    setLinks((ls) => [...ls, [from, to]]);
    setConnecting(null);
    toast('Connected.', undo);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('input, textarea, [contenteditable=true], [role=dialog]')) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      } else if (e.key === 'n' && !e.metaKey && !e.ctrlKey) addCard();
      else if (e.key === 'c' && sel && !e.metaKey && !e.ctrlKey) setConnecting(sel);
      else if ((e.key === 'Backspace' || e.key === 'Delete') && sel) remove(sel);
      else if (e.key === 'Escape') {
        setSel(null);
        setConnecting(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [addCard, remove, sel, undo]);

  const byId = Object.fromEntries(cards.map((c) => [c.id, c]));

  // ---------- Phone: frames as a stack, long-press to connect ----------
  const press = useRef<number | null>(null);
  const phone = (
    <div className="px-4 pb-8 pt-5 md:hidden">
      <div className="flex items-center justify-between">
        <Label tone="head-muted">Canvas / Brand deals board</Label>
        <Btn kind="secondary" onClick={addCard} ariaLabel="New card">
          + Card
        </Btn>
      </div>
      <p className="mt-2 text-[13px]" style={{ color: 'var(--v-head-muted)' }}>
        Long-press a card to connect it. Drag the handle to reorder.
      </p>
      {[
        { id: '', name: 'From your Record' },
        ...FRAMES.map((f) => ({ id: f.id, name: f.name })),
      ].map((f) => {
        const inFrame = cards.filter((c) => (c.frame ?? '') === f.id);
        if (!inFrame.length) return null;
        return (
          <section key={f.id || 'loose'} className="mt-6">
            <Label tone="head-muted">{f.name}</Label>
            <ul className="mt-2 space-y-2">
              {inFrame.map((c) => {
                const out = links
                  .filter(([a]) => a === c.id)
                  .map(([, b]) => byId[b]?.text)
                  .filter(Boolean);
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      data-shot={`card-${c.id}`}
                      onPointerDown={() => {
                        press.current = window.setTimeout(() => setConnecting(c.id), 450);
                      }}
                      onPointerUp={() => press.current && window.clearTimeout(press.current)}
                      onPointerLeave={() => press.current && window.clearTimeout(press.current)}
                      onClick={() =>
                        connecting && connecting !== c.id ? connect(connecting, c.id) : setSel(c.id)
                      }
                      className="v2-focus flex min-h-[64px] w-full items-start gap-3 p-4 text-left"
                      style={{
                        background: 'var(--v-surface)',
                        color: 'var(--v-ink)',
                        borderRadius: 16,
                        boxShadow: c.suggested
                          ? 'inset 0 0 0 1.5px var(--v-signal)'
                          : sel === c.id
                            ? 'inset 0 0 0 2px var(--v-ink)'
                            : 'inset 0 0 0 1px var(--v-rule)',
                      }}
                    >
                      <span
                        aria-hidden
                        className="mt-1 text-[14px]"
                        style={{ color: 'var(--v-muted)' }}
                      >
                        ⋮⋮
                      </span>
                      <span className="flex-1">
                        <span className="block text-[16px] leading-[1.35]">{c.text}</span>
                        <span
                          className="mt-1 block text-[12px]"
                          style={{ color: 'var(--v-muted)' }}
                        >
                          {c.tag}
                          {out.length > 0 && ` · → ${out[0]}`}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
      {connecting && (
        <div
          role="status"
          className="fixed inset-x-3 bottom-[92px] z-40 flex items-center justify-between gap-3 p-4"
          style={{ background: 'var(--v-ink)', color: 'var(--v-canvas)', borderRadius: 16 }}
        >
          <span className="text-[14px]">Tap the card to connect it to.</span>
          <Btn
            kind="quiet"
            onClick={() => setConnecting(null)}
            style={{ color: 'var(--v-canvas)' }}
          >
            Cancel
          </Btn>
        </div>
      )}
    </div>
  );

  // ---------- Desktop: the board ----------
  const desktop = (
    <div className="relative hidden h-[calc(100vh-0px)] min-h-[720px] overflow-hidden md:block">
      <div className="absolute left-8 right-8 top-6 z-10 flex items-center justify-between">
        <div>
          <Label tone="head-muted">Canvas</Label>
          <div
            className="mt-1 text-[22px]"
            style={{
              fontFamily: DISPLAY,
              fontWeight: 500,
              color: 'var(--v-head)',
              letterSpacing: '-0.02em',
            }}
          >
            Brand deals board
          </div>
        </div>
        <div
          className="flex items-center gap-2 text-[12px]"
          style={{ color: 'var(--v-head-muted)' }}
        >
          <span>Saved</span>
          <span aria-hidden>·</span>
          <span>100%</span>
        </div>
      </div>
      <div
        ref={board}
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(var(--v-dot) 1.2px, transparent 1.2px)',
          backgroundSize: '22px 22px',
          cursor: connecting ? 'crosshair' : 'default',
        }}
        onPointerMove={(e) => {
          if (!drag || !board.current) return;
          const r = board.current.getBoundingClientRect();
          setCards((cs) =>
            cs.map((c) =>
              c.id === drag.id
                ? { ...c, x: e.clientX - r.left - drag.dx, y: e.clientY - r.top - 90 - drag.dy }
                : c
            )
          );
        }}
        onPointerUp={() => setDrag(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setSel(null);
            setConnecting(null);
          }
        }}
      >
        <div className="absolute left-0 top-[90px]" style={{ width: 1200, height: 700 }}>
          {FRAMES.map((f) => (
            <div
              key={f.id}
              className="absolute"
              style={{
                left: f.x,
                top: f.y,
                width: f.w,
                height: f.h,
                borderRadius: 22,
                boxShadow: 'inset 0 0 0 1px var(--v-dot)',
                background: 'color-mix(in srgb, var(--v-surface) 35%, transparent)',
              }}
            >
              <div className="px-5 pt-3">
                <Label tone="head-muted">{f.name}</Label>
              </div>
            </div>
          ))}
          <svg
            className="pointer-events-none absolute inset-0"
            width={1200}
            height={700}
            aria-hidden
          >
            {links.map(([a, b]) => {
              const A = byId[a];
              const B = byId[b];
              if (!A || !B) return null;
              const p = center(A);
              const q = center(B);
              const mx = (p.x + q.x) / 2;
              return (
                <path
                  key={`${a}-${b}`}
                  d={`M${p.x},${p.y} C${mx},${p.y} ${mx},${q.y} ${q.x},${q.y}`}
                  fill="none"
                  stroke="var(--v-head-muted)"
                  strokeWidth={1.25}
                  strokeDasharray="4 4"
                />
              );
            })}
          </svg>
          {cards.map((c) => {
            const isSel = sel === c.id;
            const lifted = drag?.id === c.id;
            return (
              <motion.div
                key={c.id}
                role="button"
                tabIndex={0}
                aria-pressed={isSel}
                aria-label={`${c.text}. ${c.tag ?? ''}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSel(c.id);
                }}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  if (connecting) {
                    connect(connecting, c.id);
                    return;
                  }
                  setSel(c.id);
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  snapshot();
                  setDrag({ id: c.id, dx: e.clientX - r.left, dy: e.clientY - r.top });
                }}
                animate={{ scale: lifted && !reduce ? 1.02 : 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                className="v2-focus absolute select-none p-4"
                style={{
                  left: c.x,
                  top: c.y,
                  width: W,
                  background: 'var(--v-raised)',
                  color: 'var(--v-ink)',
                  borderRadius: 14,
                  cursor: lifted ? 'grabbing' : 'grab',
                  zIndex: lifted ? 5 : isSel ? 4 : 1,
                  boxShadow: [
                    c.suggested
                      ? 'inset 0 0 0 1.5px var(--v-signal)'
                      : isSel
                        ? 'inset 0 0 0 2px var(--v-ink)'
                        : 'inset 0 0 0 1px var(--v-rule)',
                    lifted ? '0 24px 40px -20px rgba(0,0,0,0.45)' : 'var(--v-shadow)',
                  ].join(', '),
                }}
              >
                <div className="text-[14px] leading-[1.35]">{c.text}</div>
                <div
                  className="mt-2 text-[11px]"
                  style={{ color: c.suggested ? 'var(--v-signal-text)' : 'var(--v-muted)' }}
                >
                  {c.tag}
                </div>
                {c.suggested && (
                  <div className="mt-3 flex gap-1">
                    <Btn
                      kind="primary"
                      className="!min-h-[32px] px-3 text-[12px]"
                      onClick={() => {
                        snapshot();
                        setCards((cs) => [
                          ...cs.filter((x) => x.id !== 'c7'),
                          {
                            id: 's1',
                            x: 720,
                            y: 430,
                            text: 'What brands check in 10 seconds',
                            tag: 'Idea',
                          },
                          {
                            id: 's2',
                            x: 940,
                            y: 470,
                            text: 'The DM that got me my first deal',
                            tag: 'Idea',
                          },
                        ]);
                        setLinks((ls) => [...ls, ['c1', 's1'], ['c1', 's2']]);
                        toast('2 ideas added and linked to your 127K post.', undo);
                      }}
                    >
                      Add them
                    </Btn>
                  </div>
                )}
                {isSel && !c.suggested && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    <Btn
                      kind="primary"
                      className="!min-h-[30px] px-3 text-[12px]"
                      onClick={() => go('write')}
                    >
                      Write this
                    </Btn>
                    <Btn
                      kind="secondary"
                      className="!min-h-[30px] px-3 text-[12px]"
                      onClick={() => go('framework')}
                    >
                      Diagram it
                    </Btn>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Toolbar */}
      <div
        className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1 p-1.5"
        style={{
          background: 'var(--v-raised)',
          borderRadius: 999,
          boxShadow: 'var(--v-shadow), inset 0 0 0 1px var(--v-rule)',
        }}
      >
        {(
          [
            ['Select', 'V', () => setConnecting(null)],
            ['Card', 'N', addCard],
            ['Connect', 'C', () => sel && setConnecting(sel)],
            ['Frame', 'F', () => toast('Drag around cards to frame them.')],
          ] as const
        ).map(([name, key, fn]) => (
          <Btn
            key={name}
            kind={name === 'Connect' && connecting ? 'primary' : 'quiet'}
            onClick={fn}
            className="!min-h-[36px] px-3 text-[13px]"
            style={{ color: name === 'Connect' && connecting ? undefined : 'var(--v-ink)' }}
          >
            {name} <Kbd>{key}</Kbd>
          </Btn>
        ))}
      </div>
      {connecting && (
        <div
          className="absolute bottom-24 left-1/2 z-10 -translate-x-1/2 px-3 py-2 text-[13px]"
          style={{ background: 'var(--v-ink)', color: 'var(--v-canvas)', borderRadius: 10 }}
        >
          Click a card to connect. Esc to stop.
        </div>
      )}
      <div
        className="absolute bottom-7 right-8 text-[11px]"
        style={{ fontFamily: VCR, color: 'var(--v-head-muted)', letterSpacing: '0.1em' }}
      >
        ⌘Z UNDO
      </div>
    </div>
  );

  return (
    <div>
      {desktop}
      {phone}
      <div>
        <MockNote
          principle="Remove the blank page (opens on the brand's own board plus a suggestion) and open loops (half-built cards wait in place). Phone-native: a stack of frames, long-press to connect."
          cut="The 3-column kanban (Ideas / Drafting / Posted) and its composer. Status becomes a tag on the card; posting happens in the writing room."
        />
      </div>
    </div>
  );
}
