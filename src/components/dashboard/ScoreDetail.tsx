'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { RollNumber } from '@/components/dashboard/dashMotion';
import type { PhaseScore } from '@/components/dashboard/StatTiles';
import PhaseDetail from '@/components/dashboard/PhaseDetail';

// Brand score drill-down: the score tile expands (shared layoutId) into a panel
// with the full score history and, for the scan you select, what moved it:
// each phase with its change vs the scan before, the biggest mover in Klein
// blue. Esc, the close button, or the backdrop closes it; focus returns to the
// tile. Under reduced motion it simply appears.

const MONO = "var(--dash-mono, 'VCR OSD Mono', monospace)";
const BIG = "var(--dash-big, 'Inter Tight', sans-serif)";
const BLUE = '#0047FF';

export interface ScoreDetailPoint {
  id: string;
  /** "Oct 6" */
  label: string;
  value: number;
  phases: PhaseScore[];
  /** Per-phase insights for this scan, keyed by phase label ('Define'). */
  insights?: Record<string, string[]>;
  /** The scan's written summary (latest scan at least). */
  summary?: string | null;
}

function Micro({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={`text-[10px] uppercase tracking-[0.14em] ${className}`}
      style={{ fontFamily: MONO }}
    >
      {children}
    </span>
  );
}

export default function ScoreDetail({
  points,
  layoutId,
  onClose,
  initialPhase = null,
}: {
  points: ScoreDetailPoint[];
  layoutId: string;
  onClose: () => void;
  /** Open straight into one phase (from a phase meter on the tile). */
  initialPhase?: string | null;
}) {
  const [phase, setPhase] = useState<string | null>(initialPhase);
  const reduce = useReducedMotion();
  const last = points.length - 1;
  const [sel, setSel] = useState(last);
  const [hover, setHover] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const shown = hover ?? sel;
  const cur = points[shown];
  const prev = shown > 0 ? points[shown - 1] : null;

  useEffect(() => {
    // focus the close button; give focus back to whatever opened the panel
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setSel((s) => Math.max(0, s - 1));
      if (e.key === 'ArrowRight') setSel((s) => Math.min(last, s + 1));
    };
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      opener?.focus({ preventScroll: true });
    };
  }, [last, onClose]);

  // chart geometry (0-100 viewBox; padded range so the line never touches the edges)
  const values = points.map((p) => p.value);
  const lo = Math.max(0, Math.min(...values) - 8);
  const hi = Math.min(100, Math.max(...values) + 6);
  const x = (i: number) => (points.length === 1 ? 50 : (i / last) * 100);
  const y = (v: number) => 100 - ((v - lo) / Math.max(1, hi - lo)) * 100;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ');
  const area = `${line} L100,100 L0,100 Z`;
  const ticks = [lo, Math.round((lo + hi) / 2), hi];

  // what moved it: phase deltas vs the previous scan
  const moves = cur.phases.map((ph) => {
    const before = prev?.phases.find((p) => p.key === ph.key)?.value;
    return { ...ph, delta: before === undefined ? null : ph.value - before };
  });
  const top = moves.reduce<(typeof moves)[number] | null>(
    (b, m) =>
      m.delta !== null && m.delta !== 0 && (!b || Math.abs(m.delta) > Math.abs(b.delta ?? 0))
        ? m
        : b,
    null
  );
  const delta = prev ? cur.value - prev.value : null;

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
        layoutId={reduce ? undefined : layoutId}
        role="dialog"
        aria-modal="true"
        aria-label={phase ? `${phase} phase` : 'Brand score history'}
        className="relative flex max-h-[92vh] w-full max-w-[920px] flex-col overflow-y-auto p-5 md:p-8"
        style={
          {
            background: BLUE,
            color: '#FFFFFF',
            '--d-ink': '#FFFFFF',
            '--d-muted': 'rgba(255,255,255,0.72)',
          } as React.CSSProperties
        }
        transition={{ type: 'spring', duration: 0.45, bounce: 0 }}
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4">
          {phase ? (
            <Micro className="opacity-80">Brand score · {phase}</Micro>
          ) : (
            <div>
              <Micro className="opacity-80">Brand score · history</Micro>
              <div className="mt-3 flex items-start gap-1">
                <span
                  className="leading-[0.85]"
                  style={{
                    fontFamily: BIG,
                    fontSize: 'clamp(64px, 9vw, 120px)',
                    fontWeight: 500,
                    letterSpacing: '-0.045em',
                  }}
                >
                  <RollNumber value={cur.value} booted delay={0} />
                </span>
                <span className="mt-2 text-[13px] opacity-75" style={{ fontFamily: MONO }}>
                  /100
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Micro className="border border-white/40 px-2 py-[3px]">{cur.label}</Micro>
                {delta !== null && (
                  <Micro className="border border-white/40 px-2 py-[3px]">
                    {delta === 0
                      ? 'No change'
                      : `${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)} vs ${prev!.label}`}
                  </Micro>
                )}
                {shown === last && (
                  <Micro className="bg-white px-2 py-[3px] !text-[#0047FF]">Latest</Micro>
                )}
              </div>
            </div>
          )}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="shrink-0 border border-white/50 px-3 py-2 text-white hover:bg-white hover:text-[#0047FF]"
            style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em' }}
          >
            ESC ✕
          </button>
        </div>

        {phase ? (
          <div className="mt-6">
            <PhaseDetail
              phase={phase}
              points={points}
              sel={sel}
              onSelect={setSel}
              onPhase={setPhase}
              onBack={() => setPhase(null)}
            />
          </div>
        ) : (
          <>
            {/* chart */}
            <div className="mt-8 flex gap-3">
              <div className="flex h-[200px] flex-col justify-between py-0 text-right opacity-60 md:h-[240px]">
                {[...ticks].reverse().map((t) => (
                  <Micro key={t}>{t}</Micro>
                ))}
              </div>
              <div
                className="relative h-[200px] flex-1 md:h-[240px]"
                onMouseLeave={() => setHover(null)}
              >
                <motion.div
                  className="absolute inset-0"
                  initial={{
                    clipPath: reduce ? 'inset(-10% 0% -10% 0)' : 'inset(-10% 100% -10% 0)',
                  }}
                  animate={{ clipPath: 'inset(-10% 0% -10% 0)' }}
                  transition={{ duration: reduce ? 0 : 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                >
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="absolute inset-0 h-full w-full overflow-visible"
                  >
                    {[0, 50, 100].map((g) => (
                      <line
                        key={g}
                        x1="0"
                        x2="100"
                        y1={g}
                        y2={g}
                        stroke="rgba(255,255,255,0.14)"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
                    <motion.path
                      d={area}
                      fill="rgba(255,255,255,0.10)"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: reduce ? 0 : 0.5, delay: reduce ? 0 : 0.25 }}
                    />
                    <path
                      d={line}
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                    <line
                      x1={x(shown)}
                      x2={x(shown)}
                      y1="0"
                      y2="100"
                      stroke="rgba(255,255,255,0.5)"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                </motion.div>
                {points.map((p, i) => (
                  <span
                    key={p.id}
                    aria-hidden
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                    style={{
                      left: `${x(i)}%`,
                      top: `${y(p.value)}%`,
                      width: i === shown ? 12 : 8,
                      height: i === shown ? 12 : 8,
                      background: i === shown ? '#FFFFFF' : 'rgba(255,255,255,0.6)',
                      boxShadow: i === shown ? `0 0 0 3px ${BLUE}, 0 0 0 4px #FFFFFF` : undefined,
                      transition: 'width 0.12s, height 0.12s',
                    }}
                  />
                ))}
                {/* hit areas: hover previews, click selects */}
                <div className="absolute inset-0 flex">
                  {points.map((p, i) => (
                    <button
                      key={p.id}
                      type="button"
                      data-cursor="default"
                      className="h-full flex-1 cursor-pointer"
                      aria-label={`${p.label}: ${p.value}`}
                      aria-pressed={i === sel}
                      onMouseEnter={() => setHover(i)}
                      onFocus={() => setSel(i)}
                      onClick={() => setSel(i)}
                    />
                  ))}
                </div>
                <div
                  className="pointer-events-none absolute -top-2 -translate-x-1/2 -translate-y-full whitespace-nowrap bg-white px-2 py-[3px]"
                  style={{ left: `${Math.min(92, Math.max(8, x(shown)))}%`, color: BLUE }}
                >
                  <Micro>
                    {cur.label} · {cur.value}
                  </Micro>
                </div>
              </div>
            </div>
            <div className="mt-2 flex justify-between pl-9 opacity-70">
              {points.map((p, i) =>
                points.length <= 8 || i === 0 || i === last || i === shown ? (
                  <Micro key={p.id}>{p.label}</Micro>
                ) : (
                  <span key={p.id} />
                )
              )}
            </div>

            {/* what moved it */}
            {moves.length > 0 && (
              <div className="mt-8 border-t border-white/20 pt-5">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <Micro className="opacity-80">
                    {prev ? 'What moved it' : 'What it’s made of'}
                  </Micro>
                  {top && (
                    <Micro className="opacity-80">
                      Biggest mover: {top.key} {top.delta! > 0 ? '▲' : '▼'} {Math.abs(top.delta!)}
                    </Micro>
                  )}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
                  {moves.map((m) => {
                    const isTop = top?.key === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => setPhase(m.key)}
                        aria-label={`${m.key} ${m.value}: open insights`}
                        className="group -m-2 p-2 text-left transition-colors hover:bg-white/10"
                      >
                        <div className="flex items-baseline justify-between">
                          <Micro>
                            {m.key}{' '}
                            <span className="opacity-0 transition-opacity group-hover:opacity-100">
                              ↗
                            </span>
                          </Micro>
                          <span className="text-[22px] leading-none" style={{ fontFamily: BIG }}>
                            {m.value}
                          </span>
                        </div>
                        <div className="mt-2 h-[6px] w-full bg-white/20">
                          <motion.div
                            className="h-full"
                            style={{ background: isTop ? '#FFFFFF' : 'rgba(255,255,255,0.6)' }}
                            initial={false}
                            animate={{ width: `${m.value}%` }}
                            transition={{ duration: reduce ? 0 : 0.4, ease: [0.16, 1, 0.3, 1] }}
                          />
                        </div>
                        <div className="mt-1.5">
                          <Micro
                            className={
                              isTop ? 'bg-white px-1.5 py-[1px] !text-[#0047FF]' : 'opacity-70'
                            }
                          >
                            {m.delta === null
                              ? 'First scan'
                              : m.delta === 0
                                ? 'No change'
                                : `${m.delta > 0 ? '▲' : '▼'} ${Math.abs(m.delta)}`}
                          </Micro>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {cur.summary && (
              <div className="mt-8 border-t border-white/20 pt-5">
                <Micro className="opacity-80">The read on this scan</Micro>
                <p className="mt-3 max-w-[68ch] text-[15px] leading-relaxed text-white/90">
                  {cur.summary}
                </p>
              </div>
            )}
          </>
        )}

        <div className="mt-6 opacity-60">
          <Micro>
            {phase
              ? '← → to step through scans'
              : 'Click a phase for its insights · ← → to step through scans'}{' '}
            · Esc to close
          </Micro>
        </div>
      </motion.div>
    </div>
  );
}
