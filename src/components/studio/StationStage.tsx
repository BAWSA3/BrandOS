'use client';

import { useEffect, useState } from 'react';
import { stationSlug, type Mode } from '@/components/StationCard';
import { REVEAL_TOP, type StageNumber } from '@/lib/studio-stages';

/**
 * The user's station at its current build stage.
 *
 * Stage 0 is the empty plot with the finished station hovering above it as a
 * faint blueprint (same treatment as the reserved sign card). From stage 1 the
 * finished station art is revealed from the bottom up to the stage's floor line,
 * over a full-size blueprint ghost of the rest. Interim art until per-stage
 * renders exist (spec: "Station art per stage"); the reveal line comes from
 * REVEAL_TOP so real art can replace this without touching callers.
 *
 * On mount (and whenever the stage rises) the new floor builds upward.
 *
 * `reaction` lets the title-screen menu drive the station (only the built part
 * reacts): power (LEDs light up with a flicker), scan (a scan line sweeps up),
 * focus (the view eases toward the base: sign + board), blueprint (monochrome
 * blue with a grid: "under the hood").
 */

export type StationReaction = 'power' | 'scan' | 'focus' | 'blueprint' | null;

const BLUE = '#0047FF';

export interface StationStageProps {
  archetype: string | null;
  stage: StageNumber;
  mode?: Mode;
  /** Skip the build-up animation (e.g. thumbnails). */
  still?: boolean;
  /** Menu-driven reaction (title screen). */
  reaction?: StationReaction;
  className?: string;
}

export default function StationStage({
  archetype,
  stage,
  mode = 'day',
  still = false,
  className = '',
  reaction = null,
}: StationStageProps) {
  const slug = archetype ? stationSlug(archetype) : null;
  const target = REVEAL_TOP[stage];
  // Start one stage lower and rise to the target after mount, so the floor builds in.
  const [top, setTop] = useState(
    still ? target : REVEAL_TOP[Math.max(0, stage - 1) as StageNumber]
  );
  useEffect(() => {
    if (still) return;
    // A short timer (not rAF, which pauses in hidden tabs) so the start state paints first.
    const id = window.setTimeout(() => setTop(target), 80);
    return () => window.clearTimeout(id);
  }, [target, still]);

  const ghostFilter =
    mode === 'day' ? 'grayscale(1) contrast(1.3)' : 'grayscale(1) brightness(1.7)';
  const ghostBlend = mode === 'day' ? 'multiply' : 'screen';
  const building = stage > 0 && stage < 3;

  return (
    <div
      className={`studio-stage relative w-full select-none overflow-hidden ${className}`}
      style={{ aspectRatio: '1194 / 1492', background: mode === 'day' ? '#E8E9ED' : '#010B10' }}
    >
      <div
        className="station-scene absolute inset-0"
        style={{
          // same backdrop as the frame, so the blueprint tint covers it evenly
          background: mode === 'day' ? '#E8E9ED' : '#010B10',
          transformOrigin: '50% 86%',
          transform: reaction === 'focus' ? 'scale(1.09) translateY(-2%)' : 'none',
          filter:
            reaction === 'blueprint'
              ? mode === 'day'
                ? 'grayscale(1) sepia(1) hue-rotate(190deg) saturate(3.2) brightness(1.02)'
                : 'grayscale(1) sepia(1) hue-rotate(190deg) saturate(4) brightness(1.25)'
              : 'none',
        }}
      >
        {stage === 0 || !slug ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- pre-scaled pixel art */}
            <img
              src={`/worlds/stations/plot-${mode}.png`}
              alt={
                slug ? 'Your empty plot, with your station blueprint above it' : 'Your empty plot'
              }
              className="absolute inset-0 h-full w-full"
              draggable={false}
            />
            {slug && (
              /* eslint-disable-next-line @next/next/no-img-element -- pixel art */
              <img
                aria-hidden
                src={`/worlds/stations/${slug}-${mode}.png`}
                alt=""
                className="station-bob pointer-events-none absolute"
                style={{
                  left: '22%',
                  top: '-6%',
                  width: '56%',
                  opacity: mode === 'day' ? 0.16 : 0.22,
                  filter: ghostFilter,
                  mixBlendMode: ghostBlend,
                }}
                draggable={false}
              />
            )}
          </>
        ) : (
          <>
            {/* Blueprint of the whole station */}
            {/* eslint-disable-next-line @next/next/no-img-element -- pixel art */}
            <img
              aria-hidden
              src={`/worlds/stations/${slug}-${mode}.png`}
              alt=""
              className="pointer-events-none absolute inset-0 h-full w-full"
              style={{
                opacity: mode === 'day' ? 0.15 : 0.22,
                filter: ghostFilter,
                mixBlendMode: ghostBlend,
              }}
              draggable={false}
            />
            {/* The built part, revealed from the bottom up */}
            {/* eslint-disable-next-line @next/next/no-img-element -- pixel art */}
            <img
              src={`/worlds/stations/${slug}-${mode}.png`}
              alt={stage === 3 ? 'Your finished brand station' : 'Your brand station, partly built'}
              className="studio-build absolute inset-0 h-full w-full"
              style={{ clipPath: `inset(${still ? target : top}% 0 0 0)` }}
              draggable={false}
            />
            {/* Construction line at the top of what's built */}
            {building && (
              <div
                aria-hidden
                className="studio-build-line pointer-events-none absolute"
                style={{
                  left: '16%',
                  right: '16%',
                  top: `${still ? target : top}%`,
                  height: 2,
                  background: BLUE,
                  opacity: 0.85,
                }}
              />
            )}
          </>
        )}
      </div>

      {/* --- menu reactions (overlays) --- */}
      {slug && stage > 0 && (
        <>
          {/* power: the station's LEDs light up (built part only) */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ clipPath: `inset(${still ? target : top}% 0 0 0)` }}
          >
            {reaction === 'power' &&
              [0, 1, 2, 3].map((k) => (
                <div
                  key={k}
                  className="station-power-on absolute inset-0"
                  style={{
                    animationDelay: `${k * 70}ms`,
                    backgroundImage: `url(/worlds/stations/${slug}-${mode}.png)`,
                    backgroundSize: '100% 100%',
                    filter:
                      mode === 'day'
                        ? 'brightness(1.75) saturate(1.6)'
                        : 'brightness(2.1) saturate(1.5)',
                    WebkitMaskImage: `url(/worlds/stations/masks/${slug}-${mode}-led${k}.png)`,
                    maskImage: `url(/worlds/stations/masks/${slug}-${mode}-led${k}.png)`,
                    WebkitMaskSize: '100% 100%',
                    maskSize: '100% 100%',
                  }}
                />
              ))}
          </div>
        </>
      )}
      {/* scan: a line sweeps up over what's built (or the plot) */}
      {reaction === 'scan' && (
        <div
          aria-hidden
          className="station-scan-line pointer-events-none absolute left-[12%] right-[12%]"
          style={
            {
              '--scan-end': `${slug && stage > 0 ? Math.max(4, (still ? target : top) + 2) : 46}%`,
              height: 2,
              background: mode === 'day' ? BLUE : '#7FA3FF',
              boxShadow: `0 0 0 1px ${mode === 'day' ? 'rgba(0,71,255,0.15)' : 'rgba(127,163,255,0.2)'}, 0 8px 24px ${mode === 'day' ? 'rgba(0,71,255,0.25)' : 'rgba(127,163,255,0.35)'}`,
            } as React.CSSProperties
          }
        />
      )}
      {/* blueprint: a fine grid over the monochrome station */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          opacity: reaction === 'blueprint' ? 1 : 0,
          transition: 'opacity 0.4s ease',
          backgroundImage: `linear-gradient(${mode === 'day' ? 'rgba(0,71,255,0.16)' : 'rgba(127,163,255,0.18)'} 1px, transparent 1px), linear-gradient(90deg, ${mode === 'day' ? 'rgba(0,71,255,0.16)' : 'rgba(127,163,255,0.18)'} 1px, transparent 1px)`,
          backgroundSize: '22px 22px',
        }}
      />
    </div>
  );
}
