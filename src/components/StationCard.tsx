'use client';

import { useRef, useState } from 'react';
import { useCardImageSave } from '@/lib/use-card-image-save';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';

/**
 * "Your brand station" — the shareable card shown after a scan. Each archetype
 * has its own pixel-art station (public/worlds/stations/<slug>-<mode>.png),
 * cleaned to a 48-colour, 597x746 pixel grid, then shipped 2x (1194x1492, each
 * art pixel an exact 2x2 block) and scaled smoothly. Hard-edged scaling by a
 * non-integer factor (~1.8x on phones) made pixels uneven widths, so diagonals
 * looked choppy; smooth scaling from the 2x master keeps every pixel even. Day = BrandOS light palette, Night = Terminal OS. The handle and score
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

export type Mode = 'day' | 'night';

export const THEME: Record<
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

export const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";
export const PIXEL = "'PP NeueBit', 'VCR OSD Mono', monospace";

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
  const cardRef = useRef<HTMLDivElement>(null);
  const { status, prepare, save } = useCardImageSave(
    cardRef,
    `brandos-blueprint-${username}-${mode}.png`,
    mode,
    `${username}:${score}`
  );

  const slug = stationSlug(archetype);
  if (!slug) return null;

  const info = getArchetypeInfo(archetype);
  const t = THEME[mode];

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

        {/* Station art — 2x master (see top comment), scaled smoothly. The scan
            shows the finished station as a BLUEPRINT ("the station you're
            building"); in the studio users start on an empty plot and build it. */}
        {/* Animation CSS lives in globals.css under .station-art. It used to be a
            nested <style jsx> block, which the production build never scoped
            onto these elements, so the station didn't animate on prod. */}
        <div className="station-art relative overflow-hidden" style={{ background: t.bg }}>
          {/* Idle animation (code-only, no extra art). The art has an opaque
              background with the grid baked in, so the station stays planted
              (floating it slid the whole picture against the CSS grid).
              Instead: its screens and neon power on in hard, stepped flickers
              through a per-station glow mask (public/worlds/stations/masks),
              and a blueprint scan beam sweeps down every few seconds; night
              adds a scanline drift. Off under prefers-reduced-motion and left
              out of saved images. */}
          <div className="station-bob relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- art is pre-scaled; next/image would re-encode it */}
            <img
              src={`/worlds/stations/${slug}-${mode}.png`}
              alt={`${info?.name ?? archetype} brand station blueprint`}
              width={597}
              height={746}
              className="block w-full h-auto select-none"
              style={{ imageRendering: 'auto' }}
              draggable={false}
              onLoad={prepare}
            />
            <div
              aria-hidden
              data-station-fx
              className="station-glow pointer-events-none absolute inset-0"
              style={{
                backgroundImage: `url(/worlds/stations/${slug}-${mode}.png)`,
                backgroundSize: '100% 100%',
                imageRendering: 'auto',
                filter:
                  mode === 'day'
                    ? 'brightness(1.35) saturate(1.25)'
                    : 'brightness(1.6) saturate(1.3)',
                WebkitMaskImage: `url(/worlds/stations/masks/${slug}-${mode}.png)`,
                maskImage: `url(/worlds/stations/masks/${slug}-${mode}.png)`,
                WebkitMaskSize: '100% 100%',
                maskSize: '100% 100%',
              }}
            />
          </div>
          {mode === 'night' && (
            <div
              aria-hidden
              data-station-fx
              className="station-scan pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, rgba(0,255,136,0.05) 0px, rgba(0,255,136,0.05) 1px, transparent 1px, transparent 4px)',
              }}
            />
          )}
          <div
            aria-hidden
            data-station-fx
            className="station-beam pointer-events-none absolute inset-x-0"
            style={{
              height: '14%',
              background:
                mode === 'day'
                  ? 'linear-gradient(to bottom, rgba(10,132,255,0) 0%, rgba(10,132,255,0.12) 85%, rgba(10,132,255,0.55) 100%)'
                  : 'linear-gradient(to bottom, rgba(0,255,136,0) 0%, rgba(0,255,136,0.10) 85%, rgba(0,255,136,0.5) 100%)',
            }}
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
