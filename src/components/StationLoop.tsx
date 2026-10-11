'use client';

import { useEffect, useRef, useState } from 'react';
import { stationSlug } from '@/components/StationCard';

// The photoreal station loop (rendered in Blender: scripts/blender/station.py)
// as the station page hero. A 6 s seamless loop encoded on the station page's
// background (#F2F0EF), so it sits on the page with no visible frame. Shows a
// still poster for reduced-motion users. Add each archetype to LOOPS as its
// render lands in public/worlds/stations/loops/.

const LOOPS = new Set(['build-exe']);

export function hasStationLoop(archetype: string | null | undefined) {
  const slug = archetype ? stationSlug(archetype) : null;
  return !!slug && LOOPS.has(slug);
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

  if (!slug || !LOOPS.has(slug)) return null;
  const base = `/worlds/stations/loops/${slug}-day`;
  return (
    <div className="mb-2 w-full max-w-[480px]">
      <video
        ref={ref}
        className="block h-auto w-full"
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
