'use client';

import { useRef, useState } from 'react';
import { DASH_FONTS } from '@/components/dashboard/dashFonts';
import { captureNode } from '@/lib/capture-node';
import type { ScoreCardData } from '@/lib/score-card';

// The shareable brand-score card (spec 2026-10-14): square, the brand score +
// change, three bullets (↑ working, ↓ drifted, ★ best post), photo, archetype,
// date, wordmark + mybrandos.app/@handle. "Copy image" puts a 1080×1080 PNG on
// the clipboard (download where the browser won't copy images).

const MONO = DASH_FONTS.mono;
const BIG = DASH_FONTS.big;
const BLUE = '#0047FF';
const INK = '#0E0E0E';

/** Card skins (2026-10-14), all from the BrandOS palette. */
export type CardSkin = 'bone' | 'klein' | 'night';
const SKINS: Record<
  CardSkin,
  {
    label: string;
    bg: string;
    ink: string;
    muted: string;
    score: string;
    rule: string;
    up: string;
    down: string;
    chipUp: [string, string];
    chipDown: [string, string];
    wordmark: string;
    initialBg: string;
  }
> = {
  bone: {
    label: 'Bone',
    bg: '#F2EFE8',
    ink: INK,
    muted: '#6B6862',
    score: BLUE,
    rule: 'rgba(14,14,14,0.14)',
    up: BLUE,
    down: INK,
    chipUp: [BLUE, '#FFFFFF'],
    chipDown: [INK, '#FFFFFF'],
    wordmark: '/brand/wordmark-day-480.png',
    initialBg: BLUE,
  },
  klein: {
    label: 'Klein',
    bg: BLUE,
    ink: '#FFFFFF',
    muted: 'rgba(255,255,255,0.72)',
    score: '#FFFFFF',
    rule: 'rgba(255,255,255,0.3)',
    up: '#FFFFFF',
    down: '#F2EFE8',
    chipUp: ['#FFFFFF', BLUE],
    chipDown: [INK, '#FFFFFF'],
    wordmark: '/brand/wordmark-white-480.png',
    initialBg: INK,
  },
  night: {
    label: 'Night',
    bg: '#0B0D10',
    ink: '#F2EFE8',
    muted: '#9A978F',
    score: '#4D7BFF',
    rule: 'rgba(242,239,232,0.14)',
    up: '#4D7BFF',
    down: '#F2EFE8',
    chipUp: ['#4D7BFF', '#0B0D10'],
    chipDown: ['#F2EFE8', '#0B0D10'],
    wordmark: '/brand/wordmark-white-480.png',
    initialBg: '#4D7BFF',
  },
};
export const CARD_SKINS = Object.keys(SKINS) as CardSkin[];
/** Card size in CSS px; exported at 2x = 1080×1080. */
const SIZE = 540;

const hiRes = (u: string) => u.replace(/_normal(\.\w+)$/, '_400x400$1');

export function ScoreCard({ d, skin = 'bone' }: { d: ScoreCardData; skin?: CardSkin }) {
  const k = SKINS[skin];
  const delta =
    d.delta === null
      ? null
      : d.delta === 0
        ? 'No change'
        : `${d.delta > 0 ? '▲ +' : '▼ −'}${Math.abs(d.delta)}`;
  const rows: [string, string | null, string][] = [
    ['↑', d.bullets.up, k.up],
    ['↓', d.bullets.down, k.down],
    ['★', d.bullets.best, k.up],
  ];
  return (
    <div
      data-score-card
      style={{
        width: SIZE,
        height: SIZE,
        background: k.bg,
        color: k.ink,
        padding: 36,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        fontFamily: BIG,
      }}
    >
      {/* top: wordmark + date */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- captured to PNG */}
        <img src={k.wordmark} alt="BrandOS" style={{ height: 22, width: 'auto' }} />
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', color: k.muted }}>
          {d.date.toUpperCase()} CHECK-IN
        </span>
      </div>

      {/* who */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 26 }}>
        {d.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- captured to PNG
          <img
            src={hiRes(d.avatarUrl)}
            alt=""
            style={{
              width: 48,
              height: 48,
              objectFit: 'cover',
              filter: 'grayscale(1) contrast(1.25)',
            }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              background: k.initialBg,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 600,
            }}
          >
            {d.handle.charAt(0).toUpperCase()}
          </div>
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 500 }}>@{d.handle}</div>
          {d.archetype && (
            <div
              style={{
                fontFamily: MONO,
                fontSize: 11,
                letterSpacing: '0.12em',
                color: k.muted,
                marginTop: 3,
              }}
            >
              {d.archetype.toUpperCase()}
              {d.tagline ? ` · ${d.tagline.toUpperCase()}` : ''}
            </div>
          )}
        </div>
      </div>

      {/* the score */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 18 }}>
        <div
          style={{
            fontSize: 150,
            lineHeight: 0.82,
            fontWeight: 500,
            letterSpacing: '-0.05em',
            color: k.score,
          }}
        >
          {d.score}
        </div>
        <div style={{ paddingBottom: 10 }}>
          <div style={{ fontFamily: MONO, fontSize: 12, color: k.muted, letterSpacing: '0.12em' }}>
            BRAND SCORE /100
          </div>
          {delta && (
            <div
              style={{
                marginTop: 8,
                display: 'inline-block',
                padding: '5px 9px',
                fontFamily: MONO,
                fontSize: 14,
                letterSpacing: '0.08em',
                color: (d.delta ?? 0) < 0 ? k.chipDown[1] : k.chipUp[1],
                background: (d.delta ?? 0) < 0 ? k.chipDown[0] : k.chipUp[0],
              }}
            >
              {delta}
            </div>
          )}
        </div>
      </div>

      {/* three bullets */}
      <div style={{ marginTop: 'auto', borderTop: `1px solid ${k.rule}`, paddingTop: 14 }}>
        {rows
          .filter(([, t]) => t)
          .map(([mark, t, col]) => (
            <div
              key={mark}
              style={{ display: 'flex', gap: 10, fontSize: 15, lineHeight: 1.35, marginBottom: 9 }}
            >
              <span style={{ fontFamily: MONO, color: col, width: 14, flexShrink: 0 }}>{mark}</span>
              <span>{t}</span>
            </div>
          ))}
      </div>

      {/* footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: '0.14em',
          color: k.muted,
        }}
      >
        <span style={{ color: k.ink }}>MYBRANDOS.APP/@{d.handle.toUpperCase()}</span>
        <span>YOUR BRAND, SCORED</span>
      </div>
    </div>
  );
}

/** Copy the card PNG to the clipboard (or download it). */
async function copyCard(node: HTMLElement, file: string): Promise<'copied' | 'downloaded'> {
  const blob = () => captureNode(node, SIZE, 2);
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try {
      // the item takes a promise so Safari keeps the click's permission while it renders
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob() })]);
      return 'copied';
    } catch {
      // clipboard refused: fall through to a download
    }
  }
  const url = URL.createObjectURL(await blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = file;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'downloaded';
}

/**
 * The card preview + "Copy image". `tone` is the surface it sits on (the blue
 * score panel or the light check-in card).
 */
export default function ScoreCardShare({
  d,
  tone = 'light',
  preview = 200,
}: {
  d: ScoreCardData;
  tone?: 'light' | 'blue';
  /** Preview width in px (the card is scaled down to it). */
  preview?: number;
}) {
  const card = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'busy' | 'copied' | 'downloaded' | 'error'>('idle');
  // the chosen skin, remembered in this browser (this only renders after a
  // click or the check-in, never on the server, so reading storage here is safe)
  const [skin, setSkin] = useState<CardSkin>(() => {
    try {
      const v = window.localStorage.getItem('brandos:card-skin') as CardSkin | null;
      return v && CARD_SKINS.includes(v) ? v : 'bone';
    } catch {
      return 'bone';
    }
  });
  const pick = (v: CardSkin) => {
    setSkin(v);
    try {
      window.localStorage.setItem('brandos:card-skin', v);
    } catch {
      // not remembered, still applied
    }
  };
  const scale = preview / SIZE;

  const onCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // the check-in takeover closes on any other click
    const node = card.current?.querySelector('[data-score-card]') as HTMLElement | null;
    if (!node || state === 'busy') return;
    setState('busy');
    try {
      setState(
        await copyCard(node, `brandos-score-${d.handle}-${d.date.replace(/\s+/g, '-')}.png`)
      );
    } catch {
      setState('error');
    }
    window.setTimeout(() => setState('idle'), 2600);
  };

  const onBlue = tone === 'blue';
  return (
    <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
      <div
        ref={card}
        aria-hidden
        className="shrink-0 overflow-hidden"
        style={{
          width: preview,
          height: preview,
          boxShadow: onBlue ? '0 10px 30px rgba(0,0,20,0.35)' : '0 10px 26px rgba(0,0,0,0.12)',
        }}
      >
        <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          <ScoreCard d={d} skin={skin} />
        </div>
      </div>
      <div>
        <div
          className="text-[10px] uppercase tracking-[0.14em]"
          style={{ fontFamily: MONO, opacity: 0.8 }}
        >
          Today&apos;s score card · pick a colour
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Card colour">
          {CARD_SKINS.map((v) => {
            const on = skin === v;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => pick(v)}
                className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] uppercase tracking-[0.12em]"
                style={{
                  fontFamily: MONO,
                  border: `1px solid ${on ? (onBlue ? '#FFFFFF' : BLUE) : onBlue ? 'rgba(255,255,255,0.45)' : 'rgba(14,14,14,0.2)'}`,
                  background: on
                    ? onBlue
                      ? 'rgba(255,255,255,0.16)'
                      : 'rgba(0,71,255,0.08)'
                    : 'transparent',
                }}
              >
                <span
                  aria-hidden
                  className="inline-block h-3.5 w-3.5"
                  style={{
                    background: SKINS[v].bg,
                    border: `1px solid ${onBlue ? '#FFFFFF' : 'rgba(14,14,14,0.3)'}`,
                  }}
                />
                {SKINS[v].label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={(e) => void onCopy(e)}
          disabled={state === 'busy'}
          className="mt-2 px-4 py-2.5 text-[11px] uppercase tracking-[0.14em] disabled:opacity-60"
          style={{
            fontFamily: MONO,
            background: onBlue ? '#FFFFFF' : BLUE,
            color: onBlue ? BLUE : '#FFFFFF',
          }}
        >
          {state === 'busy'
            ? 'Making image…'
            : state === 'copied'
              ? 'Copied ✓ paste it anywhere'
              : state === 'downloaded'
                ? 'Downloaded ✓'
                : state === 'error'
                  ? 'Try again'
                  : 'Copy image'}
        </button>
        <div className="mt-2 text-[11px]" style={{ opacity: 0.7 }}>
          1080×1080 · score + 3 bullets
        </div>
      </div>
    </div>
  );
}
