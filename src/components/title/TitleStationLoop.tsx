'use client';

import { useEffect, useRef, useState } from 'react';
import type { StationReaction } from '@/components/studio/StationStage';
import type { Mode } from '@/components/StationCard';

// The photoreal station loop (Blender, scripts/blender/station.py) as the title
// screen hero: encoded on the title's own day / night backgrounds so it sits in
// the screen, edges feathered. Reduced motion: the still poster. Settings'
// blueprint reaction tints it like the studio room.

export const TITLE_LOOPS = new Set(['build-exe']);
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
  const base = `/worlds/stations/loops/${slug}-title-${mode === 'night' ? 'night' : 'day'}`;
  return (
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
      style={{
        WebkitMaskImage: FEATHER,
        maskImage: FEATHER,
        WebkitMaskComposite: 'source-in',
        maskComposite: 'intersect',
        filter:
          reaction === 'blueprint'
            ? 'grayscale(1) sepia(1) hue-rotate(190deg) saturate(3.2) brightness(1.02)'
            : 'none',
        transition: 'filter 0.5s ease',
      }}
    >
      <source src={`${base}.mp4`} type="video/mp4" />
    </video>
  );
}
