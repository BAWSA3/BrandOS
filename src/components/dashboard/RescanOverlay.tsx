'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ScrambleLabel } from '@/components/dashboard/dashMotion';

// The rescan moment: a terminal-style overlay that walks the four phases
// (Define → Check → Generate → Scale) while the scan runs. Stages advance on a
// timer and the last one holds until the result lands, so the overlay never
// claims "done" before the server does. Errors show inline with a close.

const MONO = "var(--dash-mono, 'VCR OSD Mono', monospace)";
const BLUE = '#0047FF';
const STAGES = [
  { key: 'Define', line: 'reading profile + positioning' },
  { key: 'Check', line: 'checking voice across posts' },
  { key: 'Generate', line: 'scoring what lands' },
  { key: 'Scale', line: 'measuring reach + momentum' },
];
const STEP_MS = 2600;
const CELLS = 14;

export default function RescanOverlay({
  handle,
  status,
  error,
  onClose,
}: {
  handle: string;
  status: 'running' | 'done' | 'error';
  error?: string | null;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (status !== 'running') return;
    const s = window.setInterval(
      () => setStage((n) => Math.min(STAGES.length - 1, n + 1)),
      STEP_MS
    );
    const t = window.setInterval(() => setTick((n) => n + 1), 120);
    return () => {
      window.clearInterval(s);
      window.clearInterval(t);
    };
  }, [status]);

  useEffect(() => {
    if (status !== 'error') return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status, onClose]);

  const done = status === 'done';
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(10,12,20,0.6)', backdropFilter: 'blur(2px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.2 }}
      role="dialog"
      aria-modal="true"
      aria-label="Rescanning your brand"
    >
      <motion.div
        className="w-full max-w-[460px] border p-6"
        style={{
          background: 'var(--d-tile, #FAF8F3)',
          borderColor: 'var(--d-rule, rgba(14,14,14,0.09))',
          color: 'var(--d-ink, #0E0E0E)',
          fontFamily: MONO,
        }}
        initial={reduce ? false : { y: 12, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.35, bounce: 0 }}
      >
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em]">
          <span style={{ color: 'var(--d-muted, #6B6B6B)' }}>
            <ScrambleLabel booted>{`rescan · @${handle}`}</ScrambleLabel>
          </span>
          <span style={{ color: status === 'error' ? '#D70015' : BLUE }}>
            {status === 'error' ? 'error' : done ? 'complete' : 'live'}
          </span>
        </div>

        <ul className="mt-5 space-y-3" aria-live="polite">
          {STAGES.map((st, i) => {
            const state =
              done || i < stage ? 'done' : i === stage && status === 'running' ? 'run' : 'wait';
            const fill =
              state === 'done'
                ? CELLS
                : state === 'run'
                  ? Math.min(CELLS - 2, 3 + (tick % (CELLS - 3)))
                  : 0;
            return (
              <li key={st.key} className="text-[11px] uppercase tracking-[0.1em]">
                <div className="flex items-center justify-between gap-3">
                  <span
                    style={{
                      color: state === 'wait' ? 'var(--d-muted, #6B6B6B)' : 'var(--d-ink, #0E0E0E)',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')} {st.key}
                  </span>
                  <span
                    className="tabular-nums"
                    style={{ color: state === 'done' ? BLUE : 'var(--d-muted, #6B6B6B)' }}
                    aria-label={`${st.key} ${state === 'done' ? 'done' : state === 'run' ? 'scanning' : 'queued'}`}
                  >
                    [{'█'.repeat(fill)}
                    {'░'.repeat(CELLS - fill)}]{' '}
                    {state === 'done' ? 'OK' : state === 'run' ? '..' : '--'}
                  </span>
                </div>
                {state === 'run' && (
                  <div
                    className="mt-1 text-[10px] normal-case tracking-[0.04em]"
                    style={{ color: 'var(--d-muted, #6B6B6B)' }}
                  >
                    {'>'} {st.line}
                    <span className="animate-pulse">_</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {status === 'error' && (
          <div className="mt-6">
            <p className="text-[12px] normal-case tracking-normal" style={{ color: '#D70015' }}>
              {error || 'Scan failed. Try again in a minute.'}
            </p>
            <button
              type="button"
              autoFocus
              onClick={onClose}
              className="mt-4 border px-3 py-2 text-[10px] uppercase tracking-[0.14em]"
              style={{ borderColor: 'var(--d-rule, rgba(14,14,14,0.09))' }}
            >
              Close
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
