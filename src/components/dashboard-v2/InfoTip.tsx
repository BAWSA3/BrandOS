'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { DISPLAY } from './ui';

/**
 * The small "i" next to a term people get lost on (first-run walkthrough
 * spec). Hover opens it on desktop, a tap opens it on phones; a second tap,
 * a tap outside, Esc or a scroll closes it. One plain sentence, two at most.
 *
 * The card is portalled to the finish wrapper (`[data-finish]`), so it keeps
 * the `--v-*` tokens but not the label's opacity or VCR type, and it is
 * placed against the viewport so it never runs off a phone screen.
 */
const W = 260;
const GUTTER = 16;

export default function InfoTip({ label, children }: { label: string; children: string }) {
  const [pos, setPos] = useState<{ top: number; left: number; host: HTMLElement } | null>(null);
  const reduce = useReducedMotion();
  const btn = useRef<HTMLButtonElement>(null);
  const card = useRef<HTMLSpanElement>(null);
  const id = useId();
  const open = pos !== null;

  const show = useCallback(() => {
    const b = btn.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const width = Math.min(W, window.innerWidth - GUTTER * 2);
    const left = Math.max(GUTTER, Math.min(r.left - 8, window.innerWidth - width - GUTTER));
    const host = (b.closest('[data-finish]') as HTMLElement | null) ?? document.body;
    setPos({ top: r.bottom + 8, left, host });
  }, []);
  const hide = useCallback(() => setPos(null), []);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!btn.current?.contains(t) && !card.current?.contains(t)) hide();
    };
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && hide();
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [open, hide]);

  return (
    <span
      className="inline-flex align-middle"
      onPointerEnter={(e) => e.pointerType === 'mouse' && show()}
      onPointerLeave={(e) => e.pointerType === 'mouse' && hide()}
    >
      <button
        ref={btn}
        type="button"
        aria-label={`About ${label}`}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        onClick={() => (open ? hide() : show())}
        className="v2-focus relative ml-1.5 inline-flex h-[16px] w-[16px] items-center justify-center rounded-full text-[10px] leading-none before:absolute before:-inset-[14px] before:content-['']"
        style={{
          boxShadow: 'inset 0 0 0 1px currentColor',
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          opacity: open ? 1 : 0.6,
          textTransform: 'none',
          letterSpacing: 0,
        }}
      >
        i
      </button>
      {pos &&
        createPortal(
          <AnimatePresence>
            <motion.span
              ref={card}
              id={id}
              role="tooltip"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.16 }}
              className="fixed z-[95] block p-3 text-left text-[13px] leading-[1.45]"
              style={{
                top: pos.top,
                left: pos.left,
                width: `min(${W}px, calc(100vw - ${GUTTER * 2}px))`,
                background: 'var(--v-raised, #fff)',
                color: 'var(--v-ink, #0e0e0e)',
                borderRadius: 12,
                boxShadow:
                  'inset 0 0 0 1px var(--v-rule, rgba(0,0,0,.1)), 0 8px 24px rgba(0,0,0,0.14)',
                fontFamily: DISPLAY,
                fontWeight: 400,
                textTransform: 'none',
                letterSpacing: 0,
              }}
            >
              {children}
            </motion.span>
          </AnimatePresence>,
          pos.host
        )}
    </span>
  );
}

/** The plain sentences behind each "i" (one place, so the copy stays consistent). */
export const TIPS = {
  record:
    'Your score out of 100: how clearly your posts say who you are, and how well they land. It moves as you post.',
  classification:
    'The kind of creator your posts read as. It can change as your posts change.',
  known: "What your recent posts say you're known for, read from the posts themselves, not your bio.",
  working: 'Each kind of post you make, and how many people react when they see it. The highlighted bar lands best.',
  sharpen: 'The one change that would lift your score most right now.',
  move: "One thing to do today, picked from your own recent posts. Do it and skip the rest.",
  marks: "Notes that appear as you type: voice (sounds like you?), lane (on what you're known for?), landing (will it land?). They say what's off; you fix it.",
  liveScore: 'Your draft scored as you type, on the same scale as your score. It updates when you pause.',
  invites: 'Codes you can give friends. Each one gets them in for 30 days, free.',
  growth:
    'Followers, how much people react, how often you post and your average views, from your X account. The chart is followers over time.',
} as const;
