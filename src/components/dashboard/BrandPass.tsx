'use client';

import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import { useRef, useState } from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react';
import { useFinePointer } from '@/components/dashboard/dashMotion';
import { Typewriter } from 'motion-plus/react';

// Brand Pass: the user's brand identity card (ref: Heron Preston pass card),
// recoloured to BrandOS (bone card, ink type, Klein blue stamps) with
// annotated-diagram callouts around it. Dashboard tile + shareable image.

import type { Colorway } from '@/lib/colorways';
const BLUE = '#0047FF';
const BONE = '#ECE9E1';
const INK = '#141414';
const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";
const TYPE = "var(--pass-type, 'JetBrains Mono', ui-monospace, monospace)";

/** The Pass recolors with the creator's dashboard skin (Settings → Dashboard). */
interface PassSkin {
  bg: string;
  ink: string;
  /** Stamp, station strip, the no-photo portrait. */
  accent: string;
  /** Type on the accent strip. */
  onAccent: string;
  portrait: string;
  dashed: string;
  /** Paper: a hairline so the white card reads on white. */
  edge?: string;
}
const PASS_SKINS: Record<Colorway, PassSkin> = {
  bone: {
    bg: BONE,
    ink: INK,
    accent: BLUE,
    onAccent: '#FFFFFF',
    portrait: '#D9D5CB',
    dashed: 'rgba(20,20,20,0.35)',
  },
  night: {
    bg: '#17181B',
    ink: '#F2EFE8',
    accent: '#4D7BFF',
    onAccent: '#FFFFFF',
    portrait: '#2A2B2F',
    dashed: 'rgba(242,239,232,0.3)',
  },
  klein: {
    bg: BLUE,
    ink: '#FFFFFF',
    accent: '#FFFFFF',
    onAccent: BLUE,
    portrait: 'rgba(255,255,255,0.16)',
    dashed: 'rgba(255,255,255,0.45)',
  },
  paper: {
    bg: '#FFFFFF',
    ink: '#0A0A0A',
    accent: BLUE,
    onAccent: '#FFFFFF',
    portrait: '#EDEDED',
    dashed: 'rgba(10,10,10,0.3)',
    edge: 'rgba(10,10,10,0.16)',
  },
};

export interface BrandPassData {
  handle: string;
  name: string;
  avatarUrl?: string | null;
  archetype: string;
  taste: string; // short tagline
  pillars: string[];
  stationNumber: number;
  score: number;
  issued: string; // e.g. "10.2026"
}

/** Deterministic pseudo-barcode from the handle (decorative). */
function bars(seed: string): number[] {
  let h = 2166136261;
  return Array.from({ length: 46 }, (_, i) => {
    h = Math.imul(h ^ (seed.charCodeAt(i % seed.length) + i), 16777619);
    return 1 + ((h >>> 0) % 3);
  });
}

/** Deterministic pseudo-QR grid (decorative; real QR comes when wired). */
function qr(seed: string): boolean[] {
  let h = 2166136261;
  return Array.from({ length: 121 }, (_, i) => {
    h = Math.imul(h ^ (seed.charCodeAt(i % seed.length) * (i + 3)), 16777619);
    const r = Math.floor(i / 11);
    const c = i % 11;
    const finder = (r < 3 && c < 3) || (r < 3 && c > 7) || (r > 7 && c < 3);
    return finder ? !(r % 2 === 1 && c % 2 === 1) : ((h >>> 0) & 3) === 0;
  });
}

function Callout({
  id,
  label,
  className,
  line,
}: {
  id: string;
  label: string;
  className: string;
  line: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute hidden items-center gap-1 md:flex ${className}`}
      aria-hidden
    >
      <span
        className="border px-1 text-[9px] uppercase tracking-[0.08em]"
        style={{
          fontFamily: MONO,
          borderColor: 'var(--d-callout-line, rgba(231,231,228,0.5))',
          color: 'var(--d-callout, #C9C8C2)',
        }}
      >
        {id}. {label}
      </span>
      <span
        className="block h-px"
        style={{ width: line, background: 'var(--d-callout-line, rgba(231,231,228,0.45))' }}
      />
      <span
        className="block h-[5px] w-[5px] rounded-full"
        style={{ background: 'var(--d-callout, #E7E7E4)' }}
      />
    </div>
  );
}

/** X serves 48px avatars by default ("_normal"); the Pass wants the 400px one. */
function hiResAvatar(url: string): string {
  return url.replace(/_normal(\.\w+)$/, '_400x400$1');
}

export default function BrandPass({
  data,
  typeTaste,
  compact = false,
  selfHeal = false,
  skin = 'bone',
  width,
}: {
  /** Fixed card width with no callouts (dashboard v2's mid-size tile). */
  width?: number;
  data: BrandPassData;
  /** The creator's dashboard skin. */
  skin?: Colorway;
  typeTaste?: boolean;
  /** The owner's own Pass: if the stored X photo fails to load (changed on X), fetch the current one. */
  selfHeal?: boolean;
  /** Narrow tile (swapped layout): no callouts, the card drawn at a fixed size and scaled to fit. */
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  const info = getArchetypeInfo(data.archetype);
  const k = PASS_SKINS[skin];
  // the photo shown; null after it failed and no fresh one could be found
  const [photo, setPhoto] = useState<string | null>(
    data.avatarUrl ? hiResAvatar(data.avatarUrl) : null
  );
  const healed = useRef(false);
  const onPhotoError = async () => {
    if (!selfHeal || healed.current) return setPhoto(null);
    healed.current = true;
    try {
      const res = await fetch('/api/me/avatar', { method: 'POST' });
      const body = (await res.json().catch(() => ({}))) as { avatar?: string | null };
      setPhoto(res.ok && body.avatar ? body.avatar : null);
    } catch {
      setPhoto(null);
    }
  };
  const no = String(data.stationNumber).padStart(4, '0');
  // The card tilts a few degrees toward the cursor, like holding a real pass.
  const fine = useFinePointer();
  const tiltOn = fine && !reduce;
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(rx, { stiffness: 220, damping: 20 });
  const rotateY = useSpring(ry, { stiffness: 220, damping: 20 });
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltOn) return;
    const r = e.currentTarget.getBoundingClientRect();
    ry.set(((e.clientX - r.left) / r.width - 0.5) * 9);
    rx.set(-((e.clientY - r.top) / r.height - 0.5) * 7);
  };
  const onLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <div
      className={
        compact || width
          ? 'relative mx-auto max-w-full py-2'
          : 'relative px-0 py-2 md:px-[92px] md:py-6'
      }
      style={{
        perspective: 900,
        ...(width ? { width } : compact ? { width: 300, zoom: 0.78 } : {}),
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
    >
      {!compact && !width && (
        <>
          <Callout id="a" label="Portrait" className="left-0 top-[26%]" line="16px" />
          <Callout
            id="b"
            label="Archetype"
            className="right-0 top-[12%] flex-row-reverse"
            line="16px"
          />
          <Callout
            id="c"
            label="Taste"
            className="right-0 top-[46%] flex-row-reverse"
            line="16px"
          />
          <Callout id="d" label="Station" className="left-0 bottom-[16%]" line="16px" />
        </>
      )}

      <motion.div
        data-pass-card
        className="relative overflow-hidden rounded-[10px] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.45)]"
        style={{
          background: k.bg,
          color: k.ink,
          boxShadow: k.edge ? `inset 0 0 0 1px ${k.edge}` : undefined,
          containerType: 'inline-size',
          rotateX,
          rotateY,
        }}
      >
        {/* header */}
        <div className="flex items-start justify-between">
          <div>
            <div
              className="leading-none"
              style={{ fontFamily: TYPE, fontWeight: 700, fontSize: 'clamp(18px, 7cqw, 30px)' }}
            >
              BRAND PASS
            </div>
            <div
              className="mt-1 text-[9px] uppercase tracking-[0.12em] opacity-70"
              style={{ fontFamily: TYPE }}
            >
              Card code: BOS-{no}-{data.handle.toUpperCase().slice(0, 8)}
            </div>
          </div>
          {/* stamp */}
          <div
            className="flex h-[54px] w-[54px] shrink-0 rotate-[-12deg] items-center justify-center rounded-full border-2 text-center text-[9px] font-bold leading-tight"
            style={{ borderColor: k.accent, color: k.accent, fontFamily: MONO }}
          >
            {info?.name ?? data.archetype}
            <br />★
          </div>
        </div>

        <div className="mt-3 grid grid-cols-[38%_1fr] gap-3">
          {/* portrait */}
          <div>
            <div
              className="relative aspect-[3/4] overflow-hidden"
              style={{ background: k.portrait }}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote avatar
                <img
                  key={photo}
                  src={photo}
                  alt={`@${data.handle}`}
                  className="h-full w-full object-cover grayscale contrast-125"
                  onError={() => void onPhotoError()}
                />
              ) : (
                // no photo: their initial on Klein blue (the Pass is always the person)
                <div
                  className="flex h-full w-full items-center justify-center text-[44px] font-bold"
                  style={{ background: k.accent, color: k.onAccent, fontFamily: TYPE }}
                  aria-hidden
                >
                  {data.handle.replace(/^@/, '').charAt(0).toUpperCase()}
                </div>
              )}
              <span
                className="absolute left-1 top-1 text-[8px] uppercase tracking-[0.1em]"
                style={{ fontFamily: MONO, writingMode: 'vertical-rl' }}
              >
                Portrait
              </span>
            </div>
            <div
              className="mt-2 flex items-center justify-center gap-1 py-[3px]"
              style={{ background: k.accent, color: k.onAccent, fontFamily: TYPE }}
            >
              <span className="text-[10px]">✱ STATION</span>
              <span
                className="rounded-full border px-[5px] text-[10px] leading-[14px]"
                style={{ borderColor: k.onAccent }}
              >
                {no}
              </span>
              <span className="text-[10px]">✱</span>
            </div>
            <div className="mt-2 flex h-[26px] items-end gap-[1px]" aria-hidden>
              {bars(data.handle).map((w, i) => (
                <span
                  key={i}
                  className="h-full"
                  style={{ width: w, background: i % 2 ? 'transparent' : k.ink }}
                />
              ))}
            </div>
          </div>

          {/* fields */}
          <div
            className="flex min-w-0 flex-col border-l border-dashed pl-3"
            style={{ borderColor: k.dashed, fontFamily: TYPE }}
          >
            {[
              ['Brand', `@${data.handle}`],
              ['Archetype', info?.name ?? data.archetype],
              [
                'Taste',
                typeTaste !== undefined && !reduce ? (
                  <Typewriter
                    key="taste"
                    play={typeTaste}
                    speed="fast"
                    cursorStyle={{ background: k.accent, width: 2 }}
                  >
                    {data.taste}
                  </Typewriter>
                ) : (
                  data.taste
                ),
              ],
              ['Pillars', data.pillars.join(' / ')],
              ['Score', `${data.score} / 100`],
            ].map(([k, v]) => (
              <div
                key={String(k)}
                className="mb-[6px] grid grid-cols-[72px_1fr] items-baseline gap-2"
              >
                <span className="text-[11px] font-bold">{k}:</span>
                <span className="text-[11px] leading-[1.3]">{v}</span>
              </div>
            ))}
            <div className="mt-auto flex items-end justify-between pt-2">
              <div>
                <div
                  className="text-[13px] italic"
                  style={{ fontFamily: "'Instrument Serif', Georgia, serif" }}
                >
                  {data.name}
                </div>
                <div className="text-[8px] uppercase tracking-[0.12em] opacity-60">
                  Issued {data.issued} · mybrandos.app
                </div>
              </div>
              <div className="grid grid-cols-11 gap-0" style={{ width: 44 }} aria-hidden>
                {qr(data.handle).map((on, i) => (
                  <span
                    key={i}
                    className="block aspect-square"
                    style={{ background: on ? k.ink : 'transparent' }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
