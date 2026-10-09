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
 */

const BLUE = '#0047FF';

export interface StationStageProps {
  archetype: string | null;
  stage: StageNumber;
  mode?: Mode;
  /** Skip the build-up animation (e.g. thumbnails). */
  still?: boolean;
  className?: string;
}

export default function StationStage({ archetype, stage, mode = 'day', still = false, className = '' }: StationStageProps) {
  const slug = archetype ? stationSlug(archetype) : null;
  const target = REVEAL_TOP[stage];
  // Start one stage lower and rise to the target after mount, so the floor builds in.
  const [top, setTop] = useState(still ? target : REVEAL_TOP[Math.max(0, stage - 1) as StageNumber]);
  useEffect(() => {
    if (still) return;
    // A short timer (not rAF, which pauses in hidden tabs) so the start state paints first.
    const id = window.setTimeout(() => setTop(target), 80);
    return () => window.clearTimeout(id);
  }, [target, still]);

  const ghostFilter = mode === 'day' ? 'grayscale(1) contrast(1.3)' : 'grayscale(1) brightness(1.7)';
  const ghostBlend = mode === 'day' ? 'multiply' : 'screen';
  const building = stage > 0 && stage < 3;

  return (
    <div
      className={`studio-stage relative w-full select-none overflow-hidden ${className}`}
      style={{ aspectRatio: '1194 / 1492', background: mode === 'day' ? '#E8E9ED' : '#010B10' }}
    >
      {stage === 0 || !slug ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- pre-scaled pixel art */}
          <img
            src={`/worlds/stations/plot-${mode}.png`}
            alt={slug ? 'Your empty plot, with your station blueprint above it' : 'Your empty plot'}
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
            style={{ opacity: mode === 'day' ? 0.15 : 0.22, filter: ghostFilter, mixBlendMode: ghostBlend }}
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
              style={{ left: '16%', right: '16%', top: `${still ? target : top}%`, height: 2, background: BLUE, opacity: 0.85 }}
            />
          )}
        </>
      )}
    </div>
  );
}
