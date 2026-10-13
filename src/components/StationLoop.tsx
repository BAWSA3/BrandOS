'use client';

import { useEffect, useRef, useState } from 'react';
import { stationSlug } from '@/components/StationCard';

// The photoreal station loop (rendered in Blender: scripts/blender/station.py)
// as the station page hero. A 6 s seamless loop encoded on the station page's
// background (#F2F0EF), so it sits on the page with no visible frame. Shows a
// still poster for reduced-motion users. Add each archetype to LOOPS as its
// render lands in public/worlds/stations/loops/.

const LOOPS = new Set(['build-exe', 'arc', 'entropy', 'foresight', 'freq']);
// 3D stills (frame 1 of the render) for archetypes whose loop is still rendering
const STILLS = new Set(['null', 'relay', 'source']);
const FEATHER =
  'linear-gradient(to right, transparent, #000 4%, #000 96%, transparent), linear-gradient(to bottom, transparent, #000 4%, #000 96%, transparent)';

export function hasStationLoop(archetype: string | null | undefined) {
  const slug = archetype ? stationSlug(archetype) : null;
  return !!slug && (LOOPS.has(slug) || STILLS.has(slug));
}

export default function StationLoop({ archetype }: { archetype: string | null | undefined }) {
  const slug = archetype ? stationSlug(archetype) : null;
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
  }, []);

  if (!slug || !(LOOPS.has(slug) || STILLS.has(slug))) return null;
  const base = `/worlds/stations/loops/${slug}-day`;
  if (!LOOPS.has(slug)) {
    return (
      <div className="mb-2 w-full max-w-[480px]">
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-sized render */}
        <img
          src={`${base}.jpg`}
          alt="Brand station"
          width={800}
          height={1000}
          className="block h-auto w-full"
          style={{
            WebkitMaskImage: FEATHER,
            maskImage: FEATHER,
            WebkitMaskComposite: 'source-in',
            maskComposite: 'intersect',
          }}
        />
      </div>
    );
  }
  return (
    <div className="mb-2 w-full max-w-[480px]">
      <video
        ref={ref}
        className="block h-auto w-full"
        // feather the edges into the page: video encoding shifts the background by a level or two
        style={{
          WebkitMaskImage: FEATHER,
          maskImage: FEATHER,
          WebkitMaskComposite: 'source-in',
          maskComposite: 'intersect',
        }}
        width={1000}
        height={1250}
        poster={`${base}.jpg`}
        autoPlay={!still}
        muted
        loop
        playsInline
        preload="metadata"
        aria-label="Animated brand station"
      >
        <source src={`${base}.mp4`} type="video/mp4" />
      </video>
    </div>
  );
}
