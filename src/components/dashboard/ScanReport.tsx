'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { RollNumber } from '@/components/dashboard/dashMotion';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import type { ScoreDetailPoint } from '@/components/dashboard/ScoreDetail';

// One scan's full report, opened from "Recent scans" or the score panel's
// "Full report": score + change vs the scan before, the written read, the four
// phases with what the scan saw, what's working, what to fix, next moves and
// pillars. ← / → step between scans (oldest → newest), Esc closes. Uses the
// dashboard's tile colours, so it follows light/dark mode.

const MONO = "var(--dash-mono, 'VCR OSD Mono', monospace)";
const BIG = "var(--dash-big, 'Inter Tight', sans-serif)";
const BLUE = '#0047FF';

function Micro({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={`text-[10px] uppercase tracking-[0.14em] ${className}`}
      style={{ fontFamily: MONO, ...style }}
    >
      {children}
    </span>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t pt-5" style={{ borderColor: 'var(--d-rule)' }}>
      <Micro style={{ color: 'var(--d-muted)' }}>{title}</Micro>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function ScanReport({
  points,
  index,
  handle,
  onIndex,
  onClose,
}: {
  /** Every scan, oldest first. */
  points: ScoreDetailPoint[];
  index: number;
  handle: string;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const last = points.length - 1;
  const cur = points[Math.max(0, Math.min(index, last))];
  const prev = index > 0 ? points[index - 1] : null;
  const delta = prev ? cur.value - prev.value : null;
  const info = cur.archetype ? getArchetypeInfo(cur.archetype) : null;
  const quick = !cur.summary && !cur.strengths?.length && !cur.improvements?.length;
  const date = cur.date
    ? new Date(cur.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : cur.label;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && index > 0) onIndex(index - 1);
      if (e.key === 'ArrowRight' && index < last) onIndex(index + 1);
    };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      opener?.focus({ preventScroll: true });
    };
  }, [index, last, onClose, onIndex]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-8">
      <motion.button
        type="button"
        aria-label="Close"
        data-cursor="default"
        className="absolute inset-0 cursor-default"
        style={{ background: 'rgba(10,12,20,0.55)', backdropFilter: 'blur(2px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0 : 0.2 }}
        onClick={onClose}
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Scan report, ${date}`}
        className="relative flex max-h-[92vh] w-full max-w-[860px] flex-col overflow-y-auto border p-5 md:p-8"
        style={{ background: 'var(--d-tile)', borderColor: 'var(--d-rule)', color: 'var(--d-ink)' }}
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? undefined : { opacity: 0, y: 14 }}
        transition={{ type: 'spring', duration: 0.4, bounce: 0 }}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4">
          <Micro style={{ color: 'var(--d-muted)' }}>
            Scan report · @{handle} · {index + 1} of {points.length}
          </Micro>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="shrink-0 border px-3 py-2 hover:bg-[#0047FF] hover:text-white"
            style={{
              borderColor: 'var(--d-rule)',
              fontFamily: MONO,
              fontSize: 11,
              letterSpacing: '0.14em',
            }}
          >
            ESC ✕
          </button>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={cur.id}
            initial={reduce ? false : { opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -10 }}
            transition={{ duration: 0.18 }}
          >
            {/* hero */}
            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <div className="flex items-start gap-1">
                <span
                  className="leading-[0.85]"
                  style={{
                    fontFamily: BIG,
                    fontSize: 'clamp(64px, 9vw, 112px)',
                    fontWeight: 500,
                    letterSpacing: '-0.045em',
                    color: BLUE,
                  }}
                >
                  <RollNumber value={cur.value} booted delay={0} />
                </span>
                <span
                  className="mt-2 text-[13px]"
                  style={{ fontFamily: MONO, color: 'var(--d-muted)' }}
                >
                  /100
                </span>
              </div>
              {info && (
                <div
                  className="flex h-[64px] w-[64px] rotate-[-10deg] items-center justify-center rounded-full border-2 text-center text-[9px] font-bold leading-tight"
                  style={{ borderColor: BLUE, color: BLUE, fontFamily: MONO }}
                  aria-label={`Archetype ${info.name}`}
                >
                  {info.name}
                  <br />★
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Micro className="border px-2 py-[3px]" style={{ borderColor: 'var(--d-rule)' }}>
                {date}
              </Micro>
              {delta !== null && (
                <Micro className="border px-2 py-[3px]" style={{ borderColor: 'var(--d-rule)' }}>
                  {delta === 0
                    ? 'No change'
                    : `${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)} vs ${prev!.label}`}
                </Micro>
              )}
              {index === last && (
                <Micro className="px-2 py-[3px] text-white" style={{ background: BLUE }}>
                  Latest
                </Micro>
              )}
              {info?.tagline && (
                <Micro className="px-1 py-[3px]" style={{ color: 'var(--d-muted)' }}>
                  {info.tagline}
                </Micro>
              )}
            </div>

            <div className="mt-6 space-y-6">
              {cur.summary ? (
                <p className="max-w-[70ch] text-[15px] leading-relaxed">{cur.summary}</p>
              ) : quick ? (
                <p className="text-[14px]" style={{ color: 'var(--d-muted)' }}>
                  Quick scan: this one only has the score. Rescan for the full write-up.
                </p>
              ) : null}

              {cur.phases.length > 0 && (
                <Section title="Four phases">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    {cur.phases.map((ph) => {
                      const was = prev?.phases.find((p) => p.key === ph.key)?.value;
                      const d = was === undefined ? null : ph.value - was;
                      const insight = cur.insights?.[ph.key]?.[0];
                      return (
                        <div key={ph.key}>
                          <div className="flex items-baseline justify-between gap-3">
                            <Micro>{ph.key}</Micro>
                            <span className="flex items-baseline gap-2">
                              {d !== null && d !== 0 && (
                                <Micro style={{ color: d > 0 ? BLUE : 'var(--d-muted)' }}>
                                  {d > 0 ? '▲' : '▼'} {Math.abs(d)}
                                </Micro>
                              )}
                              <span
                                className="text-[22px] leading-none"
                                style={{ fontFamily: BIG }}
                              >
                                {ph.value}
                              </span>
                            </span>
                          </div>
                          <div
                            className="mt-2 h-[4px] w-full"
                            style={{ background: 'var(--d-track)' }}
                          >
                            <motion.div
                              className="h-full"
                              style={{ background: BLUE }}
                              initial={reduce ? false : { width: 0 }}
                              animate={{ width: `${ph.value}%` }}
                              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                            />
                          </div>
                          {insight && (
                            <p
                              className="mt-2 text-[13px] leading-relaxed"
                              style={{ color: 'var(--d-muted)' }}
                            >
                              {insight}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Section>
              )}

              {(!!cur.strengths?.length || !!cur.improvements?.length) && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {!!cur.strengths?.length && (
                    <Section title="What's working">
                      <ul className="space-y-2.5">
                        {cur.strengths.map((t, i) => (
                          <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed">
                            <span aria-hidden style={{ color: BLUE }}>
                              ✓
                            </span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}
                  {!!cur.improvements?.length && (
                    <Section title="What to fix">
                      <ul className="space-y-2.5">
                        {cur.improvements.map((t, i) => (
                          <li key={i} className="flex gap-2.5 text-[14px] leading-relaxed">
                            <span aria-hidden style={{ color: BLUE }}>
                              →
                            </span>
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </Section>
                  )}
                </div>
              )}

              {!!cur.nextMoves?.length && (
                <Section title="Your next moves">
                  <ol className="space-y-3">
                    {cur.nextMoves.map((t, i) => (
                      <li key={i} className="flex gap-3 text-[14px] leading-relaxed">
                        <Micro className="mt-[3px] shrink-0" style={{ color: BLUE }}>
                          {String(i + 1).padStart(2, '0')}
                        </Micro>
                        <span>{t}</span>
                      </li>
                    ))}
                  </ol>
                </Section>
              )}

              {!!cur.pillars?.length && (
                <Section title="Content pillars">
                  <div className="flex flex-wrap gap-2">
                    {cur.pillars.map((p) => (
                      <span
                        key={p}
                        className="border px-2.5 py-1 text-[13px]"
                        style={{ borderColor: 'var(--d-rule)' }}
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* step between scans */}
        <div
          className="mt-8 flex items-center justify-between gap-3 border-t pt-4"
          style={{ borderColor: 'var(--d-rule)' }}
        >
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onIndex(index - 1)}
            className="border px-3 py-2 disabled:opacity-30"
            style={{ borderColor: 'var(--d-rule)' }}
          >
            <Micro>← Older</Micro>
          </button>
          <Micro style={{ color: 'var(--d-muted)' }} className="hidden sm:inline">
            ← → to step · Esc to close
          </Micro>
          <button
            type="button"
            disabled={index === last}
            onClick={() => onIndex(index + 1)}
            className="border px-3 py-2 disabled:opacity-30"
            style={{ borderColor: 'var(--d-rule)' }}
          >
            <Micro>Newer →</Micro>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
