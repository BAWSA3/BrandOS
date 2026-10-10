'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { RollNumber } from '@/components/dashboard/dashMotion';

// The dashboard's two stat panels (dataviz: stat tile + meter forms).
//   BrandScoreTile: the one hero number, a delta vs a named period, a trend line
//     (earlier scans muted, latest in full ink) with hover tooltips, and the four
//     phase scores as meters that explain the number.
//   WeekTile: the week's goal as a segmented meter plus a Mon-Sun strip of what
//     was posted, with a legend so state never relies on colour alone.
// Both read theme colours from the dashboard's CSS vars; the score tile sits on
// Klein blue, where the vars flip to white ink.

const MONO = "var(--dash-mono, 'VCR OSD Mono', monospace)";
const BIG = "var(--dash-big, 'Inter Tight', sans-serif)";
const INK = 'var(--d-ink)';
const MUTED = 'var(--d-muted)';
const TRACK = 'var(--d-track)';
const BLUE = '#0047FF';
const EASE = [0.16, 1, 0.3, 1] as const;

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

/* ------------------------------------------------------------- brand score */

export interface ScorePoint {
  label: string; // "Mar"
  value: number;
}

export interface PhaseScore {
  key: string; // "Define"
  value: number;
}

export function BrandScoreTile({
  score,
  history,
  delta,
  phases,
  booted,
  label,
}: {
  score: number;
  history: ScorePoint[];
  delta?: { value: number; since: string };
  phases?: PhaseScore[];
  booted: boolean;
  label: React.ReactNode;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const values = history.map((p) => p.value);
  const lo = Math.min(...values) - 6;
  const hi = Math.max(...values) + 4;
  const x = (i: number) => (history.length === 1 ? 50 : (i / (history.length - 1)) * 100);
  const y = (v: number) => 100 - ((v - lo) / Math.max(1, hi - lo)) * 100;
  const line = history.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ');
  const area = `${line} L100,100 L0,100 Z`;
  const last = history.length - 1;
  const shown = hover ?? last;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        {label}
        {delta && (
          <span
            className="border px-2 py-[3px] text-[10px] uppercase tracking-[0.12em]"
            style={{ fontFamily: MONO, borderColor: 'rgba(255,255,255,0.4)', color: INK }}
          >
            {delta.value >= 0 ? '▲' : '▼'} {Math.abs(delta.value)} since {delta.since}
          </span>
        )}
      </div>

      {/* hero figure */}
      <div className="mt-4 flex items-start gap-1">
        <span
          className="leading-[0.85]"
          style={{
            fontFamily: BIG,
            fontSize: 'clamp(64px, 7vw, 104px)',
            fontWeight: 500,
            letterSpacing: '-0.045em',
          }}
        >
          <RollNumber value={score} booted={booted} delay={0.15} />
        </span>
        <span className="mt-2 text-[13px]" style={{ fontFamily: MONO, color: MUTED }}>
          /100
        </span>
      </div>

      {/* trend */}
      <div
        className="relative mt-5 h-[72px]"
        data-cursor-zone="data"
        onMouseLeave={() => setHover(null)}
      >
        <motion.div
          className="absolute inset-0"
          initial={{ clipPath: 'inset(-10% 100% -10% 0)' }}
          animate={{ clipPath: booted ? 'inset(-10% 0% -10% 0)' : 'inset(-10% 100% -10% 0)' }}
          transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full overflow-visible"
          >
            {[25, 50, 75].map((g) => (
              <line
                key={g}
                x1="0"
                x2="100"
                y1={g}
                y2={g}
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            <motion.path
              d={area}
              fill="rgba(255,255,255,0.10)"
              initial={{ opacity: 0 }}
              animate={{ opacity: booted ? 1 : 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            />
            <path
              d={line}
              fill="none"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            {hover !== null && (
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1="0"
                y2="100"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
        </motion.div>
        {/* markers (HTML so they stay square at any width) */}
        {history.map((p, i) => (
          <span
            key={p.label}
            aria-hidden
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${x(i)}%`,
              top: `${y(p.value)}%`,
              width: i === last ? 10 : 6,
              height: i === last ? 10 : 6,
              background: i === last || i === hover ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
              boxShadow: i === last ? `0 0 0 2px ${BLUE}` : undefined,
              opacity: booted ? 1 : 0,
              transition: `opacity 0.3s ease ${0.9 + i * 0.05}s`,
            }}
          />
        ))}
        {/* hover columns + tooltip */}
        <div className="absolute inset-0 flex">
          {history.map((p, i) => (
            <button
              key={p.label}
              type="button"
              data-cursor="default"
              className="h-full flex-1 cursor-default"
              aria-label={`${p.label}: ${p.value}`}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
            />
          ))}
        </div>
        <div
          className="pointer-events-none absolute -top-1 -translate-x-1/2 -translate-y-full whitespace-nowrap bg-white px-2 py-[3px] text-[10px] uppercase tracking-[0.12em]"
          style={{
            left: `${x(shown)}%`,
            fontFamily: MONO,
            color: BLUE,
            opacity: hover !== null ? 1 : 0,
            transition: 'opacity 0.15s',
          }}
        >
          {history[shown].label} · {history[shown].value}
        </div>
      </div>
      <div className="mt-2 flex justify-between" style={{ color: MUTED }}>
        {history.map((p) => (
          <Micro key={p.label}>{p.label}</Micro>
        ))}
      </div>

      {/* phase meters: what the score is made of */}
      {phases && phases.length > 0 && (
        <div
          className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3 border-t pt-4"
          style={{ borderColor: 'rgba(255,255,255,0.18)' }}
        >
          {phases.map((ph, i) => (
            <div key={ph.key}>
              <div className="flex justify-between" style={{ color: MUTED }}>
                <Micro>{ph.key}</Micro>
                <Micro className="!text-[11px]">
                  <span style={{ color: INK }}>{ph.value}</span>
                </Micro>
              </div>
              <div
                className="mt-[6px] h-[3px] w-full"
                style={{ background: 'rgba(255,255,255,0.22)' }}
              >
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: booted ? `${ph.value}%` : 0 }}
                  transition={{ duration: 0.9, ease: EASE, delay: 0.5 + i * 0.08 }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- this week */

export type DayState = 'on' | 'off' | 'none' | 'future';

export interface WeekDay {
  d: string; // "M"
  name: string; // "Tue"
  state: DayState;
  note?: string; // tooltip detail, e.g. "1 on-brand post · fit 92"
  today?: boolean;
}

export function WeekTile({
  range,
  days,
  done,
  target,
  streakWeeks,
  booted,
  label,
}: {
  range: string;
  days: WeekDay[];
  done: number;
  target: number;
  streakWeeks?: number;
  booted: boolean;
  label: React.ReactNode;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const left = Math.max(0, target - done);
  const cell = (s: DayState, today?: boolean): React.CSSProperties => {
    const base: React.CSSProperties = {
      outline: today ? `2px solid ${BLUE}` : undefined,
      outlineOffset: 2,
    };
    if (s === 'on') return { ...base, background: BLUE };
    if (s === 'off') return { ...base, background: 'transparent', border: `1.5px solid ${MUTED}` };
    if (s === 'future')
      return { ...base, background: 'transparent', border: `1px dashed ${TRACK}` };
    return { ...base, background: TRACK };
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        {label}
        <span style={{ color: MUTED }}>
          <Micro>{range}</Micro>
        </span>
      </div>

      {/* the goal */}
      <div className="mt-4 flex items-end gap-2">
        <span
          className="leading-[0.85]"
          style={{
            fontFamily: BIG,
            fontSize: 'clamp(48px, 5vw, 72px)',
            fontWeight: 500,
            letterSpacing: '-0.04em',
          }}
        >
          <RollNumber value={done} booted={booted} delay={0.3} />
          <span style={{ color: MUTED }}> / {target}</span>
        </span>
      </div>
      <div className="mt-2" style={{ color: MUTED }}>
        <Micro>On-brand posts</Micro>
      </div>

      {/* segmented meter: same-ramp track */}
      <div
        className="mt-3 grid gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${target}, 1fr)` }}
        aria-label={`${done} of ${target} on-brand posts`}
      >
        {Array.from({ length: target }, (_, i) => (
          <div key={i} className="h-[6px]" style={{ background: 'rgba(0,71,255,0.16)' }}>
            <motion.div
              className="h-full"
              style={{ background: BLUE }}
              initial={{ width: 0 }}
              animate={{ width: booted && i < done ? '100%' : 0 }}
              transition={{ duration: 0.45, ease: EASE, delay: 0.4 + i * 0.12 }}
            />
          </div>
        ))}
      </div>

      {/* the week, day by day */}
      <div className="relative mt-5" data-cursor-zone="data">
        <div className="grid grid-cols-7 gap-[6px]">
          {days.map((day, i) => (
            <button
              key={i}
              type="button"
              data-cursor="default"
              className="flex cursor-default flex-col items-center gap-[6px]"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              aria-label={`${day.name}: ${day.note ?? day.state}`}
            >
              <motion.span
                className="block aspect-square w-full"
                style={cell(day.state, day.today)}
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: booted ? 1 : 0, scale: booted ? 1 : 0.6 }}
                transition={{ duration: 0.25, delay: 0.2 + i * 0.05 }}
              />
              <span style={{ color: day.today ? INK : MUTED }}>
                <Micro>{day.d}</Micro>
              </span>
            </button>
          ))}
        </div>
        {hover !== null && (
          <div
            className="pointer-events-none absolute -top-2 -translate-x-1/2 -translate-y-full whitespace-nowrap px-2 py-[3px] text-[10px] uppercase tracking-[0.12em] text-white"
            style={{
              left: `${((hover + 0.5) / 7) * 100}%`,
              fontFamily: MONO,
              background: '#0E0E0E',
            }}
          >
            {days[hover].name} ·{' '}
            {days[hover].note ?? (days[hover].state === 'future' ? 'upcoming' : 'no post')}
          </div>
        )}
      </div>

      {/* legend (state is never colour alone) + what it means for the station */}
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1" style={{ color: MUTED }}>
        <span className="flex items-center gap-1">
          <span className="block h-[8px] w-[8px]" style={{ background: BLUE }} />
          <Micro>On-brand</Micro>
        </span>
        <span className="flex items-center gap-1">
          <span className="block h-[8px] w-[8px]" style={{ border: `1.5px solid ${MUTED}` }} />
          <Micro>Off-brand</Micro>
        </span>
      </div>
      <div
        className="mt-auto flex flex-col gap-1 border-t pt-3"
        style={{ borderColor: 'var(--d-rule)' }}
      >
        <span style={{ color: INK }}>
          <Micro>{left ? `${left} more post lights your station` : 'Goal hit · station lit'}</Micro>
        </span>
        {streakWeeks ? (
          <span style={{ color: MUTED }}>
            <Micro>Streak {streakWeeks} wks</Micro>
          </span>
        ) : null}
      </div>
    </div>
  );
}
