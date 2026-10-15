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
const MUTED = '#6B6862';
const BONE = '#F2EFE8';
/** Card size in CSS px; exported at 2x = 1080×1080. */
const SIZE = 540;

const hiRes = (u: string) => u.replace(/_normal(\.\w+)$/, '_400x400$1');

export function ScoreCard({ d }: { d: ScoreCardData }) {
  const delta =
    d.delta === null
      ? null
      : d.delta === 0
        ? 'No change'
        : `${d.delta > 0 ? '▲ +' : '▼ −'}${Math.abs(d.delta)}`;
  const rows: [string, string | null, string][] = [
    ['↑', d.bullets.up, BLUE],
    ['↓', d.bullets.down, INK],
    ['★', d.bullets.best, BLUE],
  ];
  return (
    <div
      data-score-card
      style={{
        width: SIZE,
        height: SIZE,
        background: BONE,
        color: INK,
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
        <img
          src="/brand/wordmark-day-480.png"
          alt="BrandOS"
          style={{ height: 22, width: 'auto' }}
        />
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.14em', color: MUTED }}>
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
              background: BLUE,
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
                color: MUTED,
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
            color: BLUE,
          }}
        >
          {d.score}
        </div>
        <div style={{ paddingBottom: 10 }}>
          <div style={{ fontFamily: MONO, fontSize: 12, color: MUTED, letterSpacing: '0.12em' }}>
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
                color: '#fff',
                background: (d.delta ?? 0) < 0 ? INK : BLUE,
              }}
            >
              {delta}
            </div>
          )}
        </div>
      </div>

      {/* three bullets */}
      <div
        style={{ marginTop: 'auto', borderTop: '1px solid rgba(14,14,14,0.14)', paddingTop: 14 }}
      >
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
          color: MUTED,
        }}
      >
        <span style={{ color: INK }}>MYBRANDOS.APP/@{d.handle.toUpperCase()}</span>
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
          <ScoreCard d={d} />
        </div>
      </div>
      <div>
        <div
          className="text-[10px] uppercase tracking-[0.14em]"
          style={{ fontFamily: MONO, opacity: 0.8 }}
        >
          Today&apos;s score card
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
