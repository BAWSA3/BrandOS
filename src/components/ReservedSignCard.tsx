'use client';

import { useRef, useState } from 'react';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import { useCardImageSave } from '@/lib/use-card-image-save';
import { stationSlug, THEME, MONO, PIXEL, type Mode } from './StationCard';

/**
 * The flex card: "your plot is claimed". Unlocked after reserving a station.
 *
 * Art is the empty plot with a blank construction sign (public/worlds/stations/
 * plot-<mode>.png, same pixel pipeline as the stations); a faint ghost of the
 * user's archetype station hovers above it as a blueprint. The sign text is
 * drawn in code over the measured sign face, sized in container units so it
 * scales with the card. No score on purpose: this card is status, not a grade.
 * Same object later becomes the deed (Reserved -> Building -> Owned).
 */

// Blank sign face, measured from the cleaned plot art (percent of image box).
const SIGN_FACE: Record<Mode, { left: number; top: number; width: number; height: number }> = {
  day: { left: 36.01, top: 50.54, width: 30.32, height: 12.2 },
  night: { left: 36.01, top: 48.12, width: 30.32, height: 12.06 },
};

export interface ReservedSignCardProps {
  handle: string;
  number: number;
  archetype: string | null;
  foundingPriority: boolean;
  /** Absolute share URL for this station page. */
  shareUrl: string;
  /** Hide share/save controls (e.g. on someone else's public page). */
  controls?: 'full' | 'none';
}

export function formatStationNumber(n: number): string {
  return String(n).padStart(4, '0');
}

export default function ReservedSignCard({
  handle,
  number,
  archetype,
  foundingPriority,
  shareUrl,
  controls = 'full',
}: ReservedSignCardProps) {
  const [mode, setMode] = useState<Mode>('day');
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const { status, prepare, save } = useCardImageSave(
    cardRef,
    `brandos-station-${formatStationNumber(number)}-${handle}-${mode}.png`,
    mode,
    `${handle}:${number}`
  );

  const t = THEME[mode];
  const face = SIGN_FACE[mode];
  const slug = archetype ? stationSlug(archetype) : null;
  const info = archetype ? getArchetypeInfo(archetype) : null;
  const no = formatStationNumber(number);
  // Fit the handle inside the sign: shrink long handles (pixel font ~0.55em/char).
  const handleSize = Math.min(3.6, (face.width * 0.86) / (Math.max(handle.length + 1, 6) * 0.56));

  const shareOnX = () => {
    const text = `Just reserved my brand station on BrandOS 🏗️\n\nStation #${no}${info ? ` · ${info.name}` : ''}\n\nReserve yours 👇`;
    window.open(
      `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy your station link', shareUrl);
    }
  };

  return (
    <div className="w-full max-w-[480px] mx-auto">
      <div
        ref={cardRef}
        id="brandos-reserved-card"
        className="relative w-full overflow-hidden rounded-[8px]"
        style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.ink }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 pt-4">
          <span
            className="px-2 py-1 rounded-[2px] text-[10px] tracking-[0.15em] uppercase"
            style={{
              fontFamily: MONO,
              background: t.accent,
              color: mode === 'day' ? '#FFFFFF' : '#060A0F',
            }}
          >
            RESERVED
          </span>
          <span className="text-[22px] leading-none" style={{ fontFamily: PIXEL, color: t.ink }}>
            #{no}
          </span>
        </div>
        <div
          className="px-4 pt-2 text-[10px] tracking-[0.15em] uppercase truncate"
          style={{ fontFamily: MONO, color: t.muted }}
        >
          future home of @{handle}
        </div>

        {/* Plot + ghost blueprint + sign text */}
        <div className="relative" style={{ containerType: 'inline-size' }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- art is pre-scaled; next/image would re-encode it */}
          <img
            src={`/worlds/stations/plot-${mode}.png`}
            alt={`Reserved plot for @${handle}, station #${no}`}
            width={597}
            height={746}
            className="block w-full h-auto select-none"
            style={{ imageRendering: 'auto' }}
            draggable={false}
            onLoad={prepare}
          />
          {slug && (
            /* eslint-disable-next-line @next/next/no-img-element -- pixel art */
            <img
              aria-hidden
              src={`/worlds/stations/${slug}-${mode}.png`}
              alt=""
              className="station-bob pointer-events-none absolute select-none"
              style={{
                left: '22%',
                top: '-6%',
                width: '56%',
                imageRendering: 'auto',
                opacity: mode === 'day' ? 0.16 : 0.22,
                filter:
                  mode === 'day' ? 'grayscale(1) contrast(1.4)' : 'grayscale(1) brightness(1.6)',
                mixBlendMode: mode === 'day' ? 'multiply' : 'screen',
                animation: 'reserved-ghost 4s ease-in-out infinite',
              }}
              draggable={false}
            />
          )}
          <div
            className="absolute flex flex-col items-center justify-center text-center"
            style={{
              left: `${face.left}%`,
              top: `${face.top}%`,
              width: `${face.width}%`,
              height: `${face.height}%`,
              color: mode === 'day' ? '#1D1D1F' : '#060A0F',
            }}
          >
            <div
              className="leading-none"
              style={{ fontFamily: PIXEL, fontSize: `${handleSize}cqw` }}
            >
              @{handle}
            </div>
            <div
              className="mt-[0.6cqw] leading-none tracking-wider"
              style={{
                fontFamily: MONO,
                fontSize: '1.9cqw',
                color: mode === 'day' ? '#0A84FF' : '#002FA7',
              }}
            >
              STATION #{no}
            </div>
          </div>
          {/* Faint blueprint grid */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(${t.accent} 1px, transparent 1px), linear-gradient(90deg, ${t.accent} 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
              opacity: mode === 'day' ? 0.06 : 0.05,
            }}
          />
          <style jsx global>{`
            @keyframes reserved-ghost {
              0%,
              100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-6px);
              }
            }
            @media (prefers-reduced-motion: reduce) {
              #brandos-reserved-card .station-bob {
                animation: none !important;
              }
            }
          `}</style>
        </div>

        {/* Footer */}
        <div
          className="flex items-end justify-between gap-4 px-4 pb-4 pt-3"
          style={{ background: t.panel, borderTop: `1px solid ${t.border}` }}
        >
          <div className="min-w-0">
            <div
              className="text-[24px] leading-none"
              style={{ fontFamily: PIXEL, color: t.accent }}
            >
              {info?.name ?? 'BRAND STATION'}
            </div>
            <div
              className="mt-1 text-[10px] tracking-[0.15em] uppercase"
              style={{ fontFamily: MONO, color: t.muted }}
            >
              opens 10.20 · mybrandos.app
            </div>
          </div>
          {foundingPriority && (
            <span
              className="shrink-0 px-2 py-1 rounded-[2px] text-[9px] tracking-[0.15em] uppercase text-center leading-tight"
              style={{ fontFamily: MONO, border: `1px solid ${t.accent}`, color: t.accent }}
            >
              founding
              <br />
              priority
            </span>
          )}
        </div>
      </div>

      {controls === 'full' && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {(['day', 'night'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              aria-pressed={mode === m}
              className="px-3 py-2 rounded-[4px] text-[11px] tracking-wider uppercase transition-colors"
              style={{
                fontFamily: MONO,
                background: mode === m ? '#1A1A1A' : 'transparent',
                color: mode === m ? '#FFFFFF' : '#6E6E73',
                border: '1px solid rgba(0,0,0,0.12)',
              }}
            >
              {m}
            </button>
          ))}
          <button
            onClick={shareOnX}
            className="px-4 py-2 rounded-[4px] text-[11px] tracking-wider text-white bg-[#0A84FF] hover:bg-[#0070E0] transition-colors"
            style={{ fontFamily: MONO }}
          >
            SHARE ON X
          </button>
          <button
            onClick={save}
            disabled={status === 'saving'}
            className="px-4 py-2 rounded-[4px] text-[11px] tracking-wider text-white bg-[#1A1A1A] hover:bg-[#2E6AFF] transition-colors disabled:opacity-50"
            style={{ fontFamily: MONO }}
          >
            {status === 'saving'
              ? 'SAVING...'
              : status === 'saved'
                ? 'SAVED ✓'
                : status === 'failed'
                  ? 'FAILED'
                  : 'SAVE IMAGE'}
          </button>
          <button
            onClick={copyLink}
            className="px-3 py-2 rounded-[4px] text-[11px] tracking-wider uppercase transition-colors"
            style={{ fontFamily: MONO, color: '#6E6E73', border: '1px solid rgba(0,0,0,0.12)' }}
          >
            {copied ? 'COPIED ✓' : 'COPY LINK'}
          </button>
        </div>
      )}
    </div>
  );
}
