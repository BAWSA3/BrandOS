'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { domToBlob } from 'modern-screenshot';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';

/**
 * "Your brand station" — the shareable card shown after a scan. Each archetype
 * has its own pixel-art station (public/worlds/stations/<slug>-<mode>.png),
 * cleaned to a 48-colour, 597x746 native grid and scaled up with hard pixel
 * edges. Day = BrandOS light palette, Night = Terminal OS. The handle and score
 * are drawn in code (the art's signs are blank on purpose) so text is always
 * crisp. Saving captures the card element only, not the controls below.
 *
 * Save flow: on phones, websites can't write to Photos directly; the closest is
 * the system share sheet (iOS: "Save Image" -> Photos; Android: save to
 * Gallery). iOS only opens it while the tap's user activation is still live, so
 * the PNG is pre-rendered whenever the art loads or the mode changes, and the
 * tap shares the cached file immediately. Desktop / no file-share support falls
 * back to a normal download.
 */

const STATION_SLUGS: Record<string, string> = {
  SOURCE: 'source',
  RELAY: 'relay',
  FREQ: 'freq',
  FORESIGHT: 'foresight',
  'BUILD.EXE': 'build-exe',
  ARC: 'arc',
  ENTROPY: 'entropy',
  NULL: 'null',
};

type Mode = 'day' | 'night';

const THEME: Record<
  Mode,
  { bg: string; ink: string; muted: string; accent: string; border: string; panel: string }
> = {
  day: {
    bg: '#E8E8ED',
    ink: '#1D1D1F',
    muted: '#6E6E73',
    accent: '#0A84FF',
    border: 'rgba(0,0,0,0.08)',
    panel: '#F2F0EF',
  },
  night: {
    bg: '#060A0F',
    ink: '#E6F1FF',
    muted: '#6A7D94',
    accent: '#00FF88',
    border: 'rgba(0,255,136,0.14)',
    panel: '#0A1118',
  },
};

const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";
const PIXEL = "'PP NeueBit', 'VCR OSD Mono', monospace";

export interface StationCardProps {
  archetype: string; // archetype primary, e.g. 'SOURCE' or 'BUILD.EXE'
  username: string;
  score: number;
}

export function stationSlug(archetype: string): string | null {
  return STATION_SLUGS[archetype?.toUpperCase?.()] ?? null;
}

export default function StationCard({ archetype, username, score }: StationCardProps) {
  const [mode, setMode] = useState<Mode>('day');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle');
  const cardRef = useRef<HTMLDivElement>(null);
  const cache = useRef<Partial<Record<Mode, Blob>>>({});

  const slug = stationSlug(archetype);
  const fileName = `brandos-blueprint-${username}-${mode}.png`;

  const render = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    return domToBlob(cardRef.current, { scale: 2, type: 'image/png' });
  }, []);

  // Pre-render once the art for the current mode has loaded, so a tap can
  // open the share sheet without awaiting a render first.
  const prepare = useCallback(async () => {
    if (cache.current[mode]) return;
    try {
      // Capture only after the pixel fonts are ready, or the cached image
      // would bake in the fallback font.
      await document.fonts?.ready;
      const blob = await render();
      if (blob) cache.current[mode] = blob;
    } catch {
      // non-fatal: the tap will render on demand
    }
  }, [mode, render]);

  useEffect(() => {
    // Handle / score changes invalidate the cached images.
    cache.current = {};
  }, [username, score]);

  if (!slug) return null;

  const info = getArchetypeInfo(archetype);
  const t = THEME[mode];

  const downloadFallback = (blob: Blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const save = async () => {
    setStatus('saving');
    try {
      const blob = cache.current[mode] ?? (await render());
      if (!blob) throw new Error('render failed');
      cache.current[mode] = blob;
      const file = new File([blob], fileName, { type: 'image/png' });
      if (typeof navigator !== 'undefined' && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
        } catch (err) {
          // Cancelled by the user: not a failure. Lost user activation
          // (NotAllowedError, e.g. first tap before pre-render): download instead.
          if ((err as DOMException)?.name === 'AbortError') {
            setStatus('idle');
            return;
          }
          downloadFallback(blob);
        }
      } else {
        downloadFallback(blob);
      }
      setStatus('saved');
    } catch (err) {
      console.error('[StationCard] Save failed:', err);
      setStatus('failed');
    }
    setTimeout(() => setStatus('idle'), 2000);
  };

  return (
    <div className="w-full max-w-[480px] mx-auto">
      <div
        ref={cardRef}
        id="brandos-station-card"
        className="relative w-full overflow-hidden rounded-[8px]"
        style={{ background: t.bg, border: `1px solid ${t.border}`, color: t.ink }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 pt-4">
          <span
            className="px-2 py-1 rounded-[2px] text-[10px] tracking-[0.15em] uppercase"
            style={{ fontFamily: MONO, border: `1px solid ${t.border}`, color: t.muted }}
          >
            YOUR_BLUEPRINT
          </span>
          <span
            className="truncate text-[12px] tracking-wider min-w-0"
            style={{ fontFamily: MONO, color: t.ink }}
          >
            @{username}
          </span>
        </div>
        <div
          className="px-4 pt-2 text-[10px] tracking-[0.15em] uppercase"
          style={{ fontFamily: MONO, color: t.muted }}
        >
          the station you&apos;re building
        </div>

        {/* Station art — native 597x746, scaled with hard pixel edges. The scan
            shows the finished station as a BLUEPRINT ("the station you're
            building"); in the studio users start on an empty plot and build it. */}
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- pixel art must not be resampled by next/image */}
          <img
            src={`/worlds/stations/${slug}-${mode}.png`}
            alt={`${info?.name ?? archetype} brand station blueprint`}
            width={597}
            height={746}
            className="block w-full h-auto select-none"
            style={{ imageRendering: 'pixelated' }}
            draggable={false}
            onLoad={prepare}
          />
          {/* Faint blueprint grid over the art */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `linear-gradient(${t.accent} 1px, transparent 1px), linear-gradient(90deg, ${t.accent} 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
              opacity: mode === 'day' ? 0.07 : 0.06,
            }}
          />
        </div>

        {/* Footer */}
        <div
          className="flex items-end justify-between gap-4 px-4 pb-4 pt-3"
          style={{ background: t.panel, borderTop: `1px solid ${t.border}` }}
        >
          <div className="min-w-0">
            <div
              className="text-[28px] leading-none"
              style={{ fontFamily: PIXEL, color: t.accent }}
            >
              {info?.name ?? archetype}
            </div>
            {info?.tagline && (
              <div
                className="mt-1 text-[11px] tracking-wide truncate"
                style={{ fontFamily: MONO, color: t.muted }}
              >
                {info.tagline}
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-[32px] leading-none" style={{ fontFamily: PIXEL, color: t.ink }}>
              {score}
            </div>
            <div
              className="mt-1 text-[10px] tracking-[0.15em] uppercase"
              style={{ fontFamily: MONO, color: t.muted }}
            >
              mybrandos.app
            </div>
          </div>
        </div>
      </div>

      {/* Controls (outside the captured card) */}
      <div className="mt-3 flex items-center justify-center gap-2">
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
      </div>
    </div>
  );
}
