'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { COLORWAY_SWATCH, type Colorway } from '@/lib/colorways';
import { DISPLAY, VCR } from './ui';

/**
 * ⌘K (dashboard v2, slice 3): one bar for everything secondary, so every
 * screen keeps one primary action. ⌘K / Ctrl+K on desktop, the centre tab on
 * phones (a bottom sheet). Type to filter, arrows + Enter, Esc closes.
 * Commands are built by the shell (it knows the brands and the finish).
 */

export interface Command {
  id: string;
  group: 'Make' | 'Go to' | 'Brands' | 'Finish';
  label: string;
  hint?: string;
  /** a finish swatch next to the label */
  swatch?: Colorway;
  run: () => void;
}

export default function CommandBar({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}) {
  const reduce = useReducedMotion();
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  // the shell remounts this per open (key), so the query and highlight start fresh
  useEffect(() => {
    if (open) window.setTimeout(() => input.current?.focus(), 10);
  }, [open]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle
      ? commands.filter((c) =>
          `${c.group} ${c.label} ${c.hint ?? ''}`.toLowerCase().includes(needle)
        )
      : commands;
  }, [commands, q]);

  const run = (c: Command | undefined) => {
    if (!c) return;
    onClose();
    c.run();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-[70]"
            style={{ background: 'var(--v-scrim)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            onClick={onClose}
          />
          <div
            key="wrap"
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[80] flex justify-center md:bottom-auto md:top-[14vh]"
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Command bar"
              className="pointer-events-auto max-h-[82vh] w-full overflow-hidden md:w-[600px]"
              style={{
                background: 'var(--v-surface)',
                color: 'var(--v-ink)',
                borderRadius: 22,
                boxShadow: 'var(--v-shadow), 0 0 0 1px var(--v-rule)',
              }}
              initial={reduce ? false : { opacity: 0, y: 12, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 520, damping: 38 }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setI((v) => Math.min(shown.length - 1, v + 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setI((v) => Math.max(0, v - 1));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  run(shown[i]);
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  onClose();
                }
              }}
            >
              <div
                className="flex items-center gap-3 border-b px-5"
                style={{ borderColor: 'var(--v-rule)' }}
              >
                <span aria-hidden style={{ fontFamily: VCR, color: 'var(--v-muted)' }}>
                  ⌘
                </span>
                <input
                  ref={input}
                  autoFocus
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setI(0);
                  }}
                  placeholder="Type a command, a brand or a finish"
                  aria-label="Command"
                  aria-controls="v2-commands"
                  aria-activedescendant={shown[i] ? `v2-cmd-${shown[i].id}` : undefined}
                  className="h-[60px] flex-1 bg-transparent text-[17px] outline-none"
                  style={{
                    fontFamily: DISPLAY,
                    color: 'var(--v-ink)',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    boxShadow: 'none',
                  }}
                />
                <kbd
                  className="hidden h-[20px] items-center px-1.5 text-[10px] md:inline-flex"
                  style={{
                    fontFamily: VCR,
                    borderRadius: 5,
                    boxShadow: 'inset 0 0 0 1px var(--v-rule)',
                    color: 'var(--v-muted)',
                  }}
                >
                  esc
                </kbd>
              </div>
              <ul
                id="v2-commands"
                className="max-h-[62vh] overflow-auto p-2"
                role="listbox"
                aria-label="Commands"
              >
                {shown.map((c, k) => {
                  const head = k === 0 || shown[k - 1].group !== c.group;
                  return (
                    <li key={c.id} id={`v2-cmd-${c.id}`} role="option" aria-selected={k === i}>
                      {head && (
                        <div
                          className="px-3 pb-1 pt-3 text-[10px] uppercase tracking-[0.16em]"
                          style={{ fontFamily: VCR, color: 'var(--v-muted)' }}
                        >
                          {c.group}
                        </div>
                      )}
                      <button
                        type="button"
                        tabIndex={-1}
                        onMouseEnter={() => setI(k)}
                        onClick={() => run(c)}
                        className="flex min-h-[48px] w-full items-center justify-between gap-3 px-3 text-left text-[15px] md:min-h-[42px]"
                        style={{
                          borderRadius: 12,
                          background: k === i ? 'var(--v-soft)' : 'transparent',
                          color: 'var(--v-ink)',
                        }}
                      >
                        <span className="flex items-center gap-2">
                          {c.swatch && (
                            <span
                              aria-hidden
                              className="inline-block h-3 w-3"
                              style={{
                                borderRadius: 99,
                                background: COLORWAY_SWATCH[c.swatch].canvas,
                                boxShadow: 'inset 0 0 0 1px var(--v-rule)',
                              }}
                            />
                          )}
                          {c.label}
                        </span>
                        {c.hint && (
                          <span
                            // keyboard hints (G T…) are desktop-only
                            className={`shrink-0 text-[11px] ${/^G /.test(c.hint) ? 'hidden md:inline' : ''}`}
                            style={{
                              fontFamily: VCR,
                              color: 'var(--v-muted)',
                              letterSpacing: '0.08em',
                            }}
                          >
                            {c.hint}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
                {shown.length === 0 && (
                  <li className="px-3 py-6 text-[14px]" style={{ color: 'var(--v-muted)' }}>
                    Nothing by that name. Try &ldquo;write&rdquo;, &ldquo;night&rdquo; or a brand.
                  </li>
                )}
              </ul>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
