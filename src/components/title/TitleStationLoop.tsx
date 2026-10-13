'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { StationReaction } from '@/components/studio/StationStage';
import type { Mode } from '@/components/StationCard';

// The photoreal station loop (Blender, scripts/blender/station.py) as the title
// screen hero: encoded on the title's own day / night backgrounds so it sits in
// the screen, edges feathered. Reduced motion: the still poster. Settings'
// blueprint reaction tints it like the studio room.

export const TITLE_LOOPS = new Set(['build-exe']);
// every archetype has a 3D still for the title; a loop replaces it once rendered
export const TITLE_STATIONS = new Set([
  'build-exe',
  'arc',
  'entropy',
  'foresight',
  'freq',
  'null',
  'relay',
  'source',
]);
// Blueprint (Settings): a Klein-blue colour map by brightness. A plain CSS
// filter also tinted the baked-in backdrop into a pale glowing box, so the map
// sends the backdrop's brightness band back to the exact page colour
// (TitleScreen SKIN: day #F2EFE8, night #010B10). 17 evenly spaced stops.
type RGB = [number, number, number];
const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;
const BLUEPRINT: Record<Mode, string[]> = {
  day: [
    '#00144D',
    '#001A66',
    '#002080',
    '#002A99',
    '#0033B3',
    '#003DD9',
    '#0047FF',
    '#1F5CFF',
    '#3D71FF',
    '#5C87FF',
    '#7A9CFF',
    '#99B2FF',
    '#C4CEF0',
    '#F2EFE8',
    '#F2EFE8',
    '#F2EFE8',
    '#F2EFE8',
  ],
  night: [
    '#010B10',
    '#010B10',
    '#001033',
    '#001A55',
    '#002277',
    '#002A99',
    '#0033BB',
    '#003DDD',
    '#0047FF',
    '#1F5CFF',
    '#3D71FF',
    '#5C87FF',
    '#7A9CFF',
    '#99B2FF',
    '#B8C8FF',
    '#D6DEFF',
    '#EEF2FF',
  ],
};
const table = (mode: Mode, c: number) => BLUEPRINT[mode].map((h) => hex(h)[c].toFixed(3)).join(' ');

function BlueprintFilter({ id, mode }: { id: string; mode: Mode }) {
  return (
    <svg aria-hidden width="0" height="0" className="absolute">
      <filter id={id} colorInterpolationFilters="sRGB">
        <feColorMatrix
          type="matrix"
          values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"
        />
        <feComponentTransfer>
          <feFuncR type="table" tableValues={table(mode, 0)} />
          <feFuncG type="table" tableValues={table(mode, 1)} />
          <feFuncB type="table" tableValues={table(mode, 2)} />
        </feComponentTransfer>
      </filter>
    </svg>
  );
}

const FEATHER =
  'linear-gradient(to right, transparent, #000 5%, #000 95%, transparent), linear-gradient(to bottom, transparent, #000 4%, #000 96%, transparent)';

export default function TitleStationLoop({
  slug,
  mode,
  reaction,
}: {
  slug: string;
  mode: Mode;
  reaction?: StationReaction;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [still, setStill] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      setStill(mq.matches);
      const v = ref.current;
      if (!v) return;
      if (mq.matches) v.pause();
      else void v.play().catch(() => {});
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [mode]);
  const filterId = `title-blueprint-${useId().replace(/:/g, '')}`;
  const base = `/worlds/stations/loops/${slug}-title-${mode === 'night' ? 'night' : 'day'}`;
  const style = {
    WebkitMaskImage: FEATHER,
    maskImage: FEATHER,
    WebkitMaskComposite: 'source-in',
    maskComposite: 'intersect',
    filter: reaction === 'blueprint' ? `url(#${filterId})` : 'none',
  } as const;
  const defs = <BlueprintFilter id={filterId} mode={mode} />;
  if (!TITLE_LOOPS.has(slug)) {
    const still = `/worlds/stations/3d/${slug}-title-${mode === 'night' ? 'night' : 'day'}.jpg`;
    return (
      <>
        {defs}
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized render */}
        <img
          src={still}
          alt="Your brand station"
          width={800}
          height={1000}
          className="block h-auto w-full"
          style={style}
        />
      </>
    );
  }
  return (
    <>
      {defs}
      <video
        key={base}
        ref={ref}
        className="block h-auto w-full"
        width={1000}
        height={1250}
        poster={`${base}.jpg`}
        autoPlay={!still}
        muted
        loop
        playsInline
        preload="auto"
        aria-label="Your brand station"
        style={style}
      >
        <source src={`${base}.mp4`} type="video/mp4" />
      </video>
    </>
  );
}
