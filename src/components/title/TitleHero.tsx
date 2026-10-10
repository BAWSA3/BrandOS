'use client';

import { useReducedMotion } from 'motion/react';
import StationStage from '@/components/studio/StationStage';
import BrandPass, { type BrandPassData } from '@/components/dashboard/BrandPass';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import type { StageNumber } from '@/lib/studio-stages';
import type { Mode } from '@/components/StationCard';

// The title screen's hero visual, which swaps clearly with the selected menu
// item (each change crossfades):
//   Continue    your lit station, annotated: score -> monitor, archetype -> body, stage -> base
//   Rescan      the station dims and a Klein-blue pixel grid sweeps up over it
//   My station  your Brand Pass card takes centre stage (tilts with the cursor)
//   Settings    blueprint view

export type HeroView = 'continue' | 'rescan' | 'station' | 'settings';

const BLUE = '#0047FF';
const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";
const FADE = 'opacity 0.45s ease, transform 0.6s cubic-bezier(0.16,1,0.3,1)';

const SCAN_COLS = 18;
const SCAN_ROWS = 22;

/** One annotation: a dot on the station, a line, and a boxed label. */
function Callout({
  x,
  y,
  side,
  id,
  label,
  value,
  shown,
  delay,
  mode,
}: {
  x: number;
  y: number;
  side: 'left' | 'right';
  id: string;
  label: string;
  value: string;
  shown: boolean;
  delay: number;
  mode: Mode;
}) {
  const ink = mode === 'night' ? '#E6F1FF' : '#0E0E0E';
  const bg = mode === 'night' ? 'rgba(1,11,16,0.85)' : 'rgba(246,245,241,0.92)';
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute flex items-center"
      style={{
        top: `${y}%`,
        ...(side === 'right'
          ? { left: `${x}%` }
          : { right: `${100 - x}%`, flexDirection: 'row-reverse' }),
        transform: 'translateY(-50%)',
      }}
    >
      <span
        className="block h-[7px] w-[7px] shrink-0"
        style={{
          background: BLUE,
          opacity: shown ? 1 : 0,
          transition: `opacity 0.2s ease ${delay}s`,
        }}
      />
      <span
        className="block h-px w-[16px] shrink-0 md:w-[44px]"
        style={{
          background: BLUE,
          transformOrigin: side === 'right' ? 'left' : 'right',
          transform: shown ? 'scaleX(1)' : 'scaleX(0)',
          transition: `transform 0.35s cubic-bezier(0.16,1,0.3,1) ${delay + 0.08}s`,
        }}
      />
      <span
        className="whitespace-nowrap border px-[6px] py-[2px] text-[10px] uppercase tracking-[0.1em] md:px-2 md:py-[3px] md:text-[11px] md:tracking-[0.12em]"
        style={{
          fontFamily: MONO,
          color: ink,
          background: bg,
          borderColor: BLUE,
          opacity: shown ? 1 : 0,
          transition: `opacity 0.25s ease ${delay + 0.3}s`,
        }}
      >
        <span style={{ color: BLUE }}>{id}.</span> {label ? `${label} ` : ''}
        <span style={{ color: BLUE }}>{value}</span>
      </span>
    </div>
  );
}

export default function TitleHero({
  view,
  archetype,
  stage,
  mode,
  score,
  pass,
}: {
  view: HeroView;
  archetype: string;
  stage: StageNumber;
  mode: Mode;
  score?: number | null;
  pass?: BrandPassData | null;
}) {
  const reduce = useReducedMotion();
  const info = getArchetypeInfo(archetype);
  const showPass = view === 'station' && !!pass;
  const stationOpacity = showPass ? 0.12 : view === 'rescan' ? 0.55 : 1;

  return (
    <div className="title-hero relative w-full max-w-[min(300px,38vh)] md:max-w-[min(560px,62vh)]">
      {/* the station (feathered into the screen) */}
      <div
        style={{
          WebkitMaskImage:
            'radial-gradient(ellipse 72% 70% at 50% 52%, #000 62%, transparent 100%)',
          maskImage: 'radial-gradient(ellipse 72% 70% at 50% 52%, #000 62%, transparent 100%)',
          opacity: stationOpacity,
          transform: showPass ? 'scale(0.94)' : 'none',
          transition: FADE,
        }}
      >
        <div className="relative">
          <StationStage
            archetype={archetype}
            stage={stage}
            mode={mode}
            reaction={view === 'settings' ? 'blueprint' : view === 'continue' ? 'power' : null}
          />
          {/* Rescan: Klein-blue pixels sweep up the station in waves */}
          {view === 'rescan' && !reduce && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 grid"
              style={{
                gridTemplateColumns: `repeat(${SCAN_COLS}, 1fr)`,
                gridTemplateRows: `repeat(${SCAN_ROWS}, 1fr)`,
              }}
            >
              {Array.from({ length: SCAN_COLS * SCAN_ROWS }, (_, i) => {
                const row = Math.floor(i / SCAN_COLS);
                const col = i % SCAN_COLS;
                // bottom rows first, with a little per-cell jitter so the edge dithers
                const jitter = ((col * 37 + row * 11) % 7) * 0.02;
                return (
                  <span
                    key={i}
                    className="hero-scan-pixel block"
                    style={{
                      background: BLUE,
                      animationDelay: `${(SCAN_ROWS - 1 - row) * 0.05 + jitter}s`,
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Continue: the station, annotated */}
      <Callout
        x={46}
        y={13}
        side="right"
        id="a"
        label="Score"
        value={score != null ? String(score) : '—'}
        shown={view === 'continue'}
        delay={0.1}
        mode={mode}
      />
      <Callout
        x={38}
        y={46}
        side="left"
        id="b"
        label=""
        value={info?.name ?? archetype}
        shown={view === 'continue'}
        delay={0.25}
        mode={mode}
      />
      <Callout
        x={58}
        y={84}
        side="right"
        id="c"
        label="Stage"
        value={`${stage}/3`}
        shown={view === 'continue'}
        delay={0.4}
        mode={mode}
      />

      {/* Rescan: status line */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-[4%] left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-[3px] text-[11px] uppercase tracking-[0.14em] text-white"
        style={{
          fontFamily: MONO,
          background: BLUE,
          opacity: view === 'rescan' ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        Ready to rescan · enter
      </div>

      {/* My station: the Brand Pass takes centre stage */}
      {pass && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            opacity: showPass ? 1 : 0,
            transform: showPass ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.97)',
            transition: FADE,
            pointerEvents: showPass ? 'auto' : 'none',
          }}
        >
          <div
            className="w-full max-w-[640px] shrink-0 md:w-[150%]"
            style={
              {
                // callout colours for this screen (the dashboard sets these per theme)
                '--d-callout': mode === 'night' ? '#C9C8C2' : '#4A4A47',
                '--d-callout-line':
                  mode === 'night' ? 'rgba(231,231,228,0.45)' : 'rgba(14,14,14,0.4)',
              } as React.CSSProperties
            }
          >
            <BrandPass data={pass} />
          </div>
        </div>
      )}
    </div>
  );
}
