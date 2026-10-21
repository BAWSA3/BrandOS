'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimateNumber } from 'motion-plus/react';
import { DASH_FONTS } from '@/components/dashboard/dashFonts';
import { captureNode } from '@/lib/capture-node';
import type { ScoreCardData } from '@/lib/score-card';

// The shareable brand-score card (2026-10-14): the dashboard's blue score tile
// as a square asset (score, change, history line, the four phases) + photo,
// @handle and the wordmark, in three skins (Klein = the tile, Bone, Night).
// "Copy image" puts a 1080×1080 PNG on the clipboard (download where the
// browser won't copy images).

const MONO = DASH_FONTS.mono;
const BIG = DASH_FONTS.big;
const BLUE = '#0047FF';
const INK = '#0E0E0E';
/** Card size in CSS px; exported at 2x = 1080×1080. */
const SIZE = 540;
const hiRes = (u: string) => u.replace(/_normal(\.\w+)$/, '_400x400$1');

/** Card skins (2026-10-14), all from the BrandOS palette. Klein = the dashboard tile. */
export type CardSkin = 'bone' | 'klein' | 'night' | 'paper';
interface Skin {
  label: string;
  bg: string;
  ink: string;
  muted: string;
  score: string;
  line: string;
  fill: string;
  grid: string;
  bar: string;
  track: string;
  chip: string;
  rule: string;
  wordmark: string;
  initialBg: string;
}
const SKINS: Record<CardSkin, Skin> = {
  klein: {
    label: 'Klein',
    bg: BLUE,
    ink: '#FFFFFF',
    muted: 'rgba(255,255,255,0.78)',
    score: '#FFFFFF',
    line: '#FFFFFF',
    fill: 'rgba(255,255,255,0.14)',
    grid: 'rgba(255,255,255,0.2)',
    bar: '#FFFFFF',
    track: 'rgba(255,255,255,0.25)',
    chip: 'rgba(255,255,255,0.75)',
    rule: 'rgba(255,255,255,0.3)',
    wordmark: '/brand/wordmark-white-480.png',
    initialBg: INK,
  },
  bone: {
    label: 'Bone',
    bg: '#F2EFE8',
    ink: INK,
    muted: '#6B6862',
    score: BLUE,
    line: BLUE,
    fill: 'rgba(0,71,255,0.1)',
    grid: 'rgba(14,14,14,0.08)',
    bar: BLUE,
    track: 'rgba(14,14,14,0.1)',
    chip: BLUE,
    rule: 'rgba(14,14,14,0.14)',
    wordmark: '/brand/wordmark-day-480.png',
    initialBg: BLUE,
  },
  night: {
    label: 'Night',
    bg: '#0B0D10',
    ink: '#F2EFE8',
    muted: '#9A978F',
    score: '#F2EFE8',
    line: '#4D7BFF',
    fill: 'rgba(77,123,255,0.16)',
    grid: 'rgba(242,239,232,0.1)',
    bar: '#4D7BFF',
    track: 'rgba(242,239,232,0.14)',
    chip: '#4D7BFF',
    rule: 'rgba(242,239,232,0.14)',
    wordmark: '/brand/wordmark-white-480.png',
    initialBg: '#4D7BFF',
  },
  // Paper: pure white, ink type, Klein only on the score and its line.
  paper: {
    label: 'Paper',
    bg: '#FFFFFF',
    ink: INK,
    muted: '#6B6B6B',
    score: BLUE,
    line: BLUE,
    fill: 'rgba(0,71,255,0.07)',
    grid: 'rgba(14,14,14,0.08)',
    bar: INK,
    track: 'rgba(14,14,14,0.09)',
    chip: BLUE,
    rule: 'rgba(14,14,14,0.16)',
    wordmark: '/brand/wordmark-day-480.png',
    initialBg: INK,
  },
};
/** Same order as the dashboard colorways (Settings). */
export const CARD_SKINS: CardSkin[] = ['bone', 'night', 'klein', 'paper'];

/** The score history line, drawn like the dashboard tile (grid, area, square markers). */
function Chart({ points, k }: { points: { label: string; value: number }[]; k: Skin }) {
  const W = 468;
  const H = 104;
  if (points.length < 2) return <div style={{ height: H + 24 }} />;
  const vals = points.map((p) => p.value);
  const lo = Math.max(0, Math.min(...vals) - 6);
  const hi = Math.min(100, Math.max(...vals) + 4);
  const x = (i: number) => (i / (points.length - 1)) * (W - 8) + 4;
  const y = (v: number) => H - ((v - lo) / Math.max(1, hi - lo)) * (H - 10) - 5;
  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.value)}`).join(' ');
  return (
    <div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke={k.grid} strokeWidth={1} />
        ))}
        <path d={`${line} L${x(points.length - 1)},${H} L${x(0)},${H} Z`} fill={k.fill} />
        <path d={line} fill="none" stroke={k.line} strokeWidth={2.5} />
        {points.map((p, i) => {
          const last = i === points.length - 1;
          const s = last ? 12 : 7;
          return (
            <rect
              key={i}
              x={x(i) - s / 2}
              y={y(p.value) - s / 2}
              width={s}
              height={s}
              fill={last ? k.line : k.line}
              opacity={last ? 1 : 0.7}
            />
          );
        })}
      </svg>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 10,
          fontFamily: MONO,
          fontSize: 11,
          letterSpacing: '0.14em',
          color: k.muted,
        }}
      >
        {points.map((p, i) => (
          <span key={i}>{p.label.split(' ')[0].toUpperCase()}</span>
        ))}
      </div>
    </div>
  );
}

/** The score, optionally rolling up from 0 once (the scan reveal). */
function Score({ value, roll }: { value: number; roll: boolean }) {
  const [shown, setShown] = useState(roll ? 0 : value);
  useEffect(() => {
    if (!roll) return;
    const t = window.setTimeout(() => setShown(value), 350);
    return () => window.clearTimeout(t);
  }, [roll, value]);
  return roll ? <AnimateNumber>{shown}</AnimateNumber> : <>{value}</>;
}

export function ScoreCard({
  d,
  skin = 'klein',
  roll = false,
}: {
  d: ScoreCardData;
  skin?: CardSkin;
  /** Roll the score up from 0 (the scan reveal's one headline moment). */
  roll?: boolean;
}) {
  const k = SKINS[skin];
  const micro = {
    fontFamily: MONO,
    fontSize: 12,
    letterSpacing: '0.16em',
    color: k.muted,
  } as const;
  // keep the chart readable: at most 6 points, always the first and the latest
  const hist =
    d.history.length > 6
      ? [0, 1, 2, 3, 4]
          .map((i) => d.history[Math.round((i * (d.history.length - 1)) / 5)])
          .concat(d.history[d.history.length - 1])
      : d.history;
  return (
    <div
      data-score-card
      style={{
        width: SIZE,
        height: SIZE,
        background: k.bg,
        color: k.ink,
        padding: '30px 36px 32px',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        fontFamily: BIG,
      }}
    >
      {/* who: wordmark + photo/@handle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- captured to PNG */}
        <img src={k.wordmark} alt="BrandOS" style={{ height: 22, width: 'auto' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ fontSize: 15, fontWeight: 500 }}>@{d.handle}</span>
          {d.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- captured to PNG
            <img
              src={hiRes(d.avatarUrl)}
              alt=""
              style={{
                width: 30,
                height: 30,
                objectFit: 'cover',
                filter: 'grayscale(1) contrast(1.2)',
              }}
            />
          ) : (
            <div
              style={{
                width: 30,
                height: 30,
                background: k.initialBg,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              {d.handle.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* the tile: label + change */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 22,
          paddingTop: 18,
          borderTop: `1px solid ${k.rule}`,
        }}
      >
        <span style={micro}>BRAND SCORE</span>
        {d.delta && (
          <span
            style={{
              ...micro,
              color: k.ink,
              border: `1px solid ${k.chip}`,
              padding: '6px 10px',
            }}
          >
            {d.delta.value === 0
              ? 'NO CHANGE'
              : `${d.delta.value > 0 ? '▲' : '▼'} ${Math.abs(d.delta.value)} SINCE ${d.delta.since.toUpperCase()}`}
          </span>
        )}
      </div>

      {/* the score */}
      <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: 4 }}>
        <span
          style={{
            fontSize: 132,
            lineHeight: 0.9,
            fontWeight: 500,
            letterSpacing: '-0.05em',
            color: k.score,
          }}
        >
          <Score value={d.score} roll={roll} />
        </span>
        <span style={{ ...micro, color: k.ink, fontSize: 14, marginTop: 6, marginLeft: 4 }}>
          /100
        </span>
      </div>

      {/* history, or on a first scan the archetype (there's no line to draw yet) */}
      <div style={{ marginTop: 'auto' }}>
        {hist.length < 2 && d.archetype ? (
          <div style={{ paddingBottom: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={micro}>ARCHETYPE</span>
              <span style={micro}>SCAN YOURS · MYBRANDOS.APP</span>
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 46,
                lineHeight: 0.95,
                fontWeight: 500,
                letterSpacing: '-0.035em',
                color: k.ink,
              }}
            >
              {d.archetype.name}
            </div>
            {d.archetype.tagline && (
              <div style={{ marginTop: 6, fontSize: 16, color: k.muted }}>
                {d.archetype.tagline}
              </div>
            )}
          </div>
        ) : (
          <Chart points={hist} k={k} />
        )}
      </div>

      {/* phases */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          columnGap: 28,
          rowGap: 14,
          marginTop: 18,
          paddingTop: 16,
          borderTop: `1px solid ${k.rule}`,
        }}
      >
        {d.phases.map((p) => (
          <div key={p.key}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: MONO,
                fontSize: 12,
                letterSpacing: '0.14em',
                color: k.ink,
              }}
            >
              <span>{p.key.toUpperCase()}</span>
              <span>{p.value}</span>
            </div>
            <div style={{ height: 4, background: k.track, marginTop: 7 }}>
              <div
                style={{
                  height: 4,
                  width: `${Math.max(0, Math.min(100, p.value))}%`,
                  background: k.bar,
                }}
              />
            </div>
          </div>
        ))}
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
  defaultSkin = 'klein',
  layout = 'row',
  roll = false,
  actions,
}: {
  /** 'stack': card on top, controls centred under it (the scan reveal). */
  layout?: 'row' | 'stack';
  roll?: boolean;
  /** Extra buttons under "Copy image" (e.g. Post to X). */
  actions?: React.ReactNode;
  d: ScoreCardData;
  /** The creator's dashboard colorway; the card opens in it. */
  defaultSkin?: CardSkin;
  tone?: 'light' | 'blue';
  /** Preview width in px (the card is scaled down to it). */
  preview?: number;
}) {
  const card = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'idle' | 'busy' | 'copied' | 'downloaded' | 'error'>('idle');
  // Opens in the creator's dashboard skin (Settings); picking another is a one-off.
  const [skin, setSkin] = useState<CardSkin>(defaultSkin);
  const pick = (v: CardSkin) => setSkin(v);
  const scale = preview / SIZE;

  const onCopy = async (e: React.MouseEvent) => {
    e.stopPropagation(); // the check-in takeover closes on any other click
    const node = card.current?.querySelector('[data-score-card]') as HTMLElement | null;
    if (!node || state === 'busy') return;
    setState('busy');
    try {
      setState(
        await copyCard(
          node,
          `brandos-score-${d.handle}-${new Date().toISOString().slice(0, 10)}.png`
        )
      );
    } catch {
      setState('error');
    }
    window.setTimeout(() => setState('idle'), 2600);
  };

  const onBlue = tone === 'blue';
  return (
    <div
      className={
        layout === 'stack' ? 'flex flex-col items-center gap-5' : 'flex items-center gap-4'
      }
      onClick={(e) => e.stopPropagation()}
    >
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
          <ScoreCard d={d} skin={skin} roll={roll} />
        </div>
      </div>
      <div className={layout === 'stack' ? 'flex flex-col items-center text-center' : ''}>
        <div
          className="text-[10px] uppercase tracking-[0.14em]"
          style={{ fontFamily: MONO, opacity: 0.8 }}
        >
          {layout === 'stack'
            ? 'Your score card · pick a colour'
            : "Today's score card · pick a colour"}
        </div>
        <div
          className={`mt-2 flex flex-wrap gap-1.5 ${layout === 'stack' ? 'justify-center' : ''}`}
          role="radiogroup"
          aria-label="Card colour"
        >
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
        {actions}
        <div className="mt-2 text-[11px]" style={{ opacity: 0.7 }}>
          {layout === 'stack'
            ? 'Copy the image, then paste it into your post'
            : '1080×1080 · score, history + phases'}
        </div>
      </div>
    </div>
  );
}
