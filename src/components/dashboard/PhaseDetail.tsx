'use client';

import { motion, useReducedMotion } from 'motion/react';
import { RollNumber } from '@/components/dashboard/dashMotion';
import type { ScoreDetailPoint } from '@/components/dashboard/ScoreDetail';

// One phase of the brand score, opened from a phase meter on the score tile or
// a phase card in the score panel: what the phase measures, its score and
// change for the selected scan, its history across scans, and that scan's
// insights. The weakest phase gets a "focus here" flag. Lives inside the
// score panel (same dialog), so Esc / ✕ still close everything.

const MONO = "var(--dash-mono, 'VCR OSD Mono', monospace)";
const BIG = "var(--dash-big, 'Inter Tight', sans-serif)";

export const PHASE_INFO: Record<string, { measures: string; lever: string }> = {
  Define: {
    measures: 'How clearly your profile says who you are, what you do, and who it’s for.',
    lever: 'Sharpen your bio and pinned post around one niche and one promise.',
  },
  Check: {
    measures: 'How consistent your voice and topics are from post to post.',
    lever: 'Stay on your content pillars and keep one recognisable tone, even on promo posts.',
  },
  Generate: {
    measures: 'How well your content lands: engagement, and the formats that work for you.',
    lever: 'Double down on the formats and hooks behind your best-performing posts.',
  },
  Scale: {
    measures: 'Your reach and momentum: audience size, growth, and how often you show up.',
    lever: 'Post on a steady cadence and give people a reason to share and follow.',
  },
};

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

export default function PhaseDetail({
  phase,
  all,
  points,
  sel,
  onSelect,
  onPhase,
  onBack,
}: {
  phase: string;
  /** Every scan (the 'vs previous' comparison can reach outside the timeline). */
  all?: ScoreDetailPoint[];
  /** Scans inside the current timeline. */
  points: ScoreDetailPoint[];
  sel: number;
  onSelect: (i: number) => void;
  onPhase: (key: string) => void;
  onBack: () => void;
}) {
  const reduce = useReducedMotion();
  const cur = points[sel];
  const list = all ?? points;
  const at = list.findIndex((p) => p.id === cur.id);
  const prev = at > 0 ? list[at - 1] : null;
  const valueAt = (p: ScoreDetailPoint) => p.phases.find((x) => x.key === phase)?.value;
  const value = valueAt(cur) ?? 0;
  const before = prev ? valueAt(prev) : undefined;
  const delta = before === undefined ? null : value - before;
  const weakest = cur.phases.reduce<string | null>(
    (w, p) => (!w || p.value < (cur.phases.find((x) => x.key === w)?.value ?? 101) ? p.key : w),
    null
  );
  const insights = cur.insights?.[phase] ?? [];
  const info = PHASE_INFO[phase];

  // this phase across scans (bars: compact, readable at phone width)
  const series = points.map((p) => ({ id: p.id, label: p.label, v: valueAt(p) }));

  return (
    <motion.div
      key={phase}
      initial={reduce ? false : { opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', duration: 0.35, bounce: 0 }}
    >
      <button
        type="button"
        onClick={onBack}
        className="border border-white/40 px-2.5 py-1.5 hover:bg-white hover:text-[#0047FF]"
      >
        <Micro>← All phases</Micro>
      </button>

      {/* phase switcher */}
      <div className="mt-5 flex flex-wrap gap-1.5" role="tablist" aria-label="Phases">
        {cur.phases.map((p) => (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={p.key === phase}
            onClick={() => onPhase(p.key)}
            className={`border px-2.5 py-1.5 ${
              p.key === phase
                ? 'border-white bg-white text-[#0047FF]'
                : 'border-white/30 hover:border-white'
            }`}
          >
            <Micro>
              {p.key} {p.value}
            </Micro>
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_1.2fr]">
        {/* score + meaning */}
        <div>
          <div className="flex items-start gap-1">
            <span
              className="leading-[0.85]"
              style={{
                fontFamily: BIG,
                fontSize: 'clamp(56px, 8vw, 96px)',
                fontWeight: 500,
                letterSpacing: '-0.045em',
              }}
            >
              <RollNumber value={value} booted delay={0} />
            </span>
            <span className="mt-2 text-[13px] opacity-75" style={{ fontFamily: MONO }}>
              /100
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Micro className="border border-white/40 px-2 py-[3px]">{cur.label}</Micro>
            {delta !== null && (
              <Micro className="border border-white/40 px-2 py-[3px]">
                {delta === 0
                  ? 'No change'
                  : `${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)} vs ${prev!.label}`}
              </Micro>
            )}
            {weakest === phase && cur.phases.length > 1 && (
              <Micro className="bg-white px-2 py-[3px] !text-[#0047FF]">Focus here</Micro>
            )}
          </div>
          {info && (
            <>
              <p className="mt-5 text-[15px] leading-relaxed text-white/90">{info.measures}</p>
              {weakest === phase && (
                <p className="mt-3 border-l-2 border-white pl-3 text-[14px] leading-relaxed text-white">
                  {info.lever}
                </p>
              )}
            </>
          )}
        </div>

        {/* history of this phase */}
        <div>
          <Micro className="opacity-80">{phase} over time</Micro>
          <div className="mt-3 flex h-[140px] items-end gap-1.5">
            {series.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelect(i)}
                aria-label={`${s.label}: ${s.v ?? 'no score'}`}
                aria-pressed={i === sel}
                className="group flex h-full flex-1 flex-col justify-end"
              >
                <span
                  className="mb-1 text-center opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ fontFamily: MONO, fontSize: 10, opacity: i === sel ? 1 : undefined }}
                >
                  {s.v ?? '–'}
                </span>
                <motion.span
                  className="block w-full"
                  style={{ background: i === sel ? '#FFFFFF' : 'rgba(255,255,255,0.35)' }}
                  initial={reduce ? false : { height: 0 }}
                  animate={{ height: `${s.v ?? 0}%` }}
                  transition={{
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                    delay: reduce ? 0 : i * 0.04,
                  }}
                />
              </button>
            ))}
          </div>
          <div className="mt-2 flex justify-between opacity-70">
            <Micro>{series[0]?.label}</Micro>
            {series.length > 1 && <Micro>{series[series.length - 1]?.label}</Micro>}
          </div>
        </div>
      </div>

      {/* insights */}
      <div className="mt-8 border-t border-white/20 pt-5">
        <Micro className="opacity-80">What the scan saw · {cur.label}</Micro>
        {insights.length ? (
          <ul className="mt-3 space-y-3">
            {insights.map((t, i) => (
              <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-white/90">
                <span aria-hidden className="mt-[9px] h-[6px] w-[6px] shrink-0 bg-white" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[14px] text-white/70">
            No written insights for this phase on this scan. Rescan for a fresh read.
          </p>
        )}
      </div>
    </motion.div>
  );
}
