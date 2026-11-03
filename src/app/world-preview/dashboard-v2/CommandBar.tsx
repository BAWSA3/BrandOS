'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { COLORWAYS, type Colorway } from '@/lib/colorways';
import { useV2 } from './context';
import { BRANDS, type Screen } from './sample';
import { DISPLAY, Kbd, VCR } from './ui';

/**
 * ⌘K: one bar for everything (desktop), a bottom sheet from the centre tab
 * (phone). New idea, open a workspace, jump to a brand, score a draft, switch
 * finish. Arrow keys + Enter; type to filter. Secondary actions live here so
 * the screens can keep one primary action each.
 */

type Item = { id: string; group: string; label: string; hint?: string; run: () => void };

export default function CommandBar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { go, setFinish, setBrand, toast, brand } = useV2();
  const reduce = useReducedMotion();
  const [q, setQ] = useState('');
  const [i, setI] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const items = useMemo<Item[]>(() => {
    const nav = (to: Screen, label: string, hint?: string): Item => ({
      id: `go-${to}`,
      group: 'Go to',
      label,
      hint,
      run: () => go(to),
    });
    return [
      { id: 'new', group: 'Make', label: 'New idea', hint: 'N', run: () => go('canvas') },
      { id: 'score', group: 'Make', label: 'Score a draft', hint: '⌘↵', run: () => go('write') },
      {
        id: 'fw',
        group: 'Make',
        label: 'New framework: 2x2, loop, ladder',
        run: () => go('framework'),
      },
      nav('today', "Today's move", 'G T'),
      nav('playbook', 'Playbook', 'G P'),
      nav('canvas', 'Canvas', 'G C'),
      nav('write', 'Writing room', 'G W'),
      nav('framework', 'Frameworks', 'G F'),
      nav('press', 'Your record'),
      ...BRANDS.map((b) => ({
        id: `brand-${b.id}`,
        group: 'Brands',
        label: `@${b.handle}`,
        hint: b.handle === brand ? 'Current' : b.kind,
        run: () => {
          setBrand(b.handle);
          toast(`Now on @${b.handle}.`);
        },
      })),
      {
        id: 'competitors',
        group: 'Brands',
        label: 'Competitors and audience',
        run: () => toast('Opens the Brand tab (moved off home).'),
      },
      ...COLORWAYS.map((c) => ({
        id: `finish-${c.id}`,
        group: 'Finish',
        label: `${c.name} finish`,
        hint: c.hint,
        run: () => setFinish(c.id as Colorway),
      })),
    ];
  }, [brand, go, setBrand, setFinish, toast]);

  const shown = items.filter(
    (it) => !q || `${it.group} ${it.label}`.toLowerCase().includes(q.toLowerCase())
  );

  // the shell remounts this on every open (key), so query + highlight start fresh
  useEffect(() => {
    if (open) window.setTimeout(() => input.current?.focus(), 10);
  }, [open]);

  const run = (it: Item | undefined) => {
    if (!it) return;
    onClose();
    it.run();
  };

  let lastGroup = '';
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
              className="pointer-events-auto max-h-[80vh] w-full overflow-hidden md:w-[600px]"
              style={{
                background: 'var(--v-surface)',
                color: 'var(--v-ink)',
                borderRadius: 22,
                boxShadow: 'var(--v-shadow), 0 0 0 1px var(--v-rule)',
              }}
              initial={reduce ? false : { opacity: 0, y: 12, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, y: 8, scale: 0.99 }}
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
                } else if (e.key === 'Escape') onClose();
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
                <span className="hidden md:inline">
                  <Kbd>esc</Kbd>
                </span>
              </div>
              <ul className="max-h-[60vh] overflow-auto p-2" role="listbox" aria-label="Commands">
                {shown.map((it, k) => {
                  const head = it.group !== lastGroup;
                  lastGroup = it.group;
                  return (
                    <li key={it.id} role="option" aria-selected={k === i}>
                      {head && (
                        <div
                          className="px-3 pb-1 pt-3 text-[10px] uppercase tracking-[0.16em]"
                          style={{ fontFamily: VCR, color: 'var(--v-muted)' }}
                        >
                          {it.group}
                        </div>
                      )}
                      <button
                        type="button"
                        onMouseEnter={() => setI(k)}
                        onClick={() => run(it)}
                        className="flex min-h-[48px] w-full items-center justify-between px-3 text-left text-[15px] md:min-h-[42px]"
                        style={{
                          borderRadius: 12,
                          background: k === i ? 'var(--v-soft)' : 'transparent',
                          color: 'var(--v-ink)',
                        }}
                      >
                        <span className="flex items-center gap-2">
                          {it.group === 'Finish' && (
                            <span
                              aria-hidden
                              className="inline-block h-3 w-3"
                              style={{
                                borderRadius: 99,
                                boxShadow: 'inset 0 0 0 1px var(--v-rule)',
                                background: {
                                  bone: '#F2EFE8',
                                  night: '#0B0B0C',
                                  klein: '#0047FF',
                                  paper: '#FFFFFF',
                                }[it.id.replace('finish-', '')],
                              }}
                            />
                          )}
                          {it.label}
                        </span>
                        {it.hint && (
                          <span
                            className="text-[11px]"
                            style={{
                              fontFamily: VCR,
                              color: 'var(--v-muted)',
                              letterSpacing: '0.08em',
                            }}
                          >
                            {it.hint}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
                {shown.length === 0 && (
                  <li className="px-3 py-6 text-[14px]" style={{ color: 'var(--v-muted)' }}>
                    Nothing by that name. Try &ldquo;idea&rdquo;, &ldquo;night&rdquo; or a brand.
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
