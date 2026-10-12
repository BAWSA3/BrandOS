'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useReducedMotion } from 'motion/react';
import { stationSlug } from '@/components/StationCard';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';

// The user's photoreal station (Blender: scripts/blender/station.py) as a
// dashboard tile: a seamless loop encoded on the tile colour, day in light
// mode and night in dark mode, linking to their station page. Stations whose
// loop isn't rendered yet show the 3D still. Plays only while on screen;
// reduced motion shows the still. Assets: public/worlds/stations/tile/.

const MONO = "var(--dash-mono, 'VCR OSD Mono', monospace)";
const BLUE = '#0047FF';
/** Archetypes with a rendered day + night tile loop. */
const TILE_LOOPS = new Set(['build-exe', 'arc', 'entropy', 'foresight']);
const FEATHER =
  'linear-gradient(to right, transparent, #000 5%, #000 95%, transparent), linear-gradient(to bottom, transparent, #000 4%, #000 96%, transparent)';

export default function StationTile({
  archetype,
  handle,
  stationNumber,
  mode,
}: {
  archetype: string;
  handle: string;
  stationNumber?: number | null;
  mode: 'day' | 'night';
}) {
  const slug = stationSlug(archetype);
  const reduce = useReducedMotion();
  const ref = useRef<HTMLVideoElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // play only while the tile is on screen
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (visible && !reduce) void v.play().catch(() => {});
    else v.pause();
  }, [visible, reduce, mode]);

  if (!slug) return null;
  const base = `/worlds/stations/tile/${slug}-${mode}`;
  const loop = TILE_LOOPS.has(slug) && !reduce;
  const name = getArchetypeInfo(archetype)?.name ?? archetype;
  const no = stationNumber ? `#${String(stationNumber).padStart(4, '0')}` : null;

  return (
    <Link
      href={`/station/${encodeURIComponent(handle)}`}
      className="flex h-full flex-col"
      aria-label={`Open your ${name} station`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <span
          className="text-[10px] uppercase tracking-[0.14em]"
          style={{ fontFamily: MONO, color: 'var(--d-muted)' }}
        >
          Your station
        </span>
        <span
          className="text-[10px] uppercase tracking-[0.14em]"
          style={{ fontFamily: MONO, color: BLUE }}
        >
          {no ?? 'Visit'} ↗
        </span>
      </div>

      <div ref={box} className="relative mx-auto mt-2 w-full max-w-[300px] flex-1">
        {loop ? (
          <video
            key={mode}
            ref={ref}
            className="block h-auto w-full"
            style={{
              WebkitMaskImage: FEATHER,
              maskImage: FEATHER,
              WebkitMaskComposite: 'source-in',
              maskComposite: 'intersect',
            }}
            width={640}
            height={800}
            poster={`${base}.jpg`}
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
          >
            <source src={`${base}.mp4`} type="video/mp4" />
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- pre-sized render
          <img
            src={`${base}.jpg`}
            alt=""
            width={640}
            height={800}
            className="block h-auto w-full"
            style={{
              WebkitMaskImage: FEATHER,
              maskImage: FEATHER,
              WebkitMaskComposite: 'source-in',
              maskComposite: 'intersect',
            }}
          />
        )}
      </div>

      <div className="mt-2 flex items-baseline justify-between gap-3">
        <span className="text-[15px] font-medium" style={{ color: 'var(--d-ink)' }}>
          {name}
        </span>
        <span
          className="text-[10px] uppercase tracking-[0.14em]"
          style={{ fontFamily: MONO, color: 'var(--d-muted)' }}
        >
          @{handle}
        </span>
      </div>
    </Link>
  );
}
