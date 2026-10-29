'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Typewriter } from 'motion-plus/react';
import { useV2 } from './context';
import { DAYS, RECORD } from './sample';
import { CORAL, KLEIN } from './tokens';
import { Btn, DISPLAY, Label, MockNote, VCR } from './ui';

/**
 * Signature moment: THE PRESS. The member's Record as a plate on the Klein
 * field: one cell per day for 12 weeks, each a 1-bit dither whose density is
 * how much was made that day. Ending a session presses today's cell in (the
 * stamp: 112% → 100%, a ring outward), it turns coral ("this one"), and the
 * machine types the entry line. The plate is the share card.
 *
 * Reduced motion: today's cell is simply there, the line is printed in full.
 */

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const LIT = [0, 3, 6, 10, 16];
const CELL = 36;
const GAP = 6;
const STEP = CELL + GAP;

function Cell({ x, y, level }: { x: number; y: number; level: number }) {
  const dots = [];
  for (let i = 0; i < 16; i++) {
    if (BAYER[i] >= LIT[level]) continue;
    const cx = x + 4.5 + (i % 4) * 9;
    const cy = y + 4.5 + Math.floor(i / 4) * 9;
    dots.push(<rect key={i} x={cx - 2.25} y={cy - 2.25} width={4.5} height={4.5} fill="#fff" />);
  }
  return <g>{dots}</g>;
}

export default function Press() {
  const { go, toast } = useV2();
  const reduce = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const [n, setN] = useState(0);

  useEffect(() => {
    const t = window.setTimeout(() => setPressed(true), reduce ? 0 : 700);
    return () => window.clearTimeout(t);
  }, [reduce, n]);

  const W = 12 * STEP - GAP;
  const H = 7 * STEP - GAP;
  const today = { col: 11, row: 6 };
  const tx = today.col * STEP;
  const ty = today.row * STEP;
  const worked = DAYS.filter((d) => d > 0).length + 1;
  const line = '27 OCT 2026 / 1 POST / 2 IDEAS / ENTERED';

  return (
    <div className="mx-auto w-full max-w-[880px] px-4 pb-10 pt-6 md:px-10 md:pt-14">
      <Label tone="head-muted">The Record / @{RECORD.handle}</Label>
      <h1
        className="mt-3 text-[34px] leading-[1.02] md:text-[56px]"
        style={{
          fontFamily: DISPLAY,
          fontWeight: 500,
          letterSpacing: '-0.04em',
          color: 'var(--v-head)',
        }}
      >
        Today is on the record.
      </h1>

      {/* The plate: always the Klein field, in every finish (it is the share card) */}
      <div
        className="mt-8 p-5 md:p-9"
        style={{
          background: KLEIN,
          color: '#fff',
          borderRadius: 22,
          boxShadow: '0 0 0 1px var(--v-signal-edge), var(--v-shadow)',
        }}
      >
        <div
          className="flex items-start justify-between gap-3 text-[10px] tracking-[0.16em]"
          style={{ fontFamily: VCR }}
        >
          <span>BRANDOS / THE RECORD</span>
          <span className="text-right">ENTRY No. {RECORD.entry}</span>
        </div>
        <div className="mt-5 flex items-end justify-between gap-4">
          <div
            className="text-[32px] leading-none md:text-[48px]"
            style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: '-0.04em' }}
          >
            @{RECORD.handle}
          </div>
          <div
            className="text-right text-[10px] leading-[1.6] tracking-[0.14em]"
            style={{ fontFamily: VCR }}
          >
            {RECORD.classification}
            <br />
            SCORE {RECORD.score}
          </div>
        </div>

        <svg
          viewBox={`-2 -2 ${W + 4} ${H + 4}`}
          className="mt-6 block h-auto w-full"
          role="img"
          aria-label={`${worked} of 84 days with work in the last 12 weeks; today pressed in`}
        >
          {DAYS.map((lvl, i) => {
            const col = Math.floor(i / 7);
            const row = i % 7;
            if (col === today.col && row === today.row) return null;
            return (
              <g key={i}>
                <rect
                  x={col * STEP}
                  y={row * STEP}
                  width={CELL}
                  height={CELL}
                  fill="none"
                  stroke="rgba(255,255,255,0.22)"
                  strokeWidth={1}
                />
                <Cell x={col * STEP} y={row * STEP} level={lvl} />
              </g>
            );
          })}
          {/* today */}
          <rect
            x={tx}
            y={ty}
            width={CELL}
            height={CELL}
            fill="none"
            stroke="#fff"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          {pressed && (
            <>
              {!reduce && (
                <motion.rect
                  key={`ring-${n}`}
                  x={tx}
                  y={ty}
                  width={CELL}
                  height={CELL}
                  fill="none"
                  stroke={CORAL}
                  strokeWidth={2}
                  style={{
                    transformOrigin: `${tx + CELL / 2}px ${ty + CELL / 2}px`,
                    transformBox: 'view-box',
                  }}
                  initial={{ scale: 1, opacity: 0.9 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                />
              )}
              <motion.rect
                key={`cell-${n}`}
                x={tx}
                y={ty}
                width={CELL}
                height={CELL}
                fill={CORAL}
                style={{
                  transformOrigin: `${tx + CELL / 2}px ${ty + CELL / 2}px`,
                  transformBox: 'view-box',
                }}
                initial={reduce ? false : { scale: 1.12, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.42, ease: 'easeOut' }}
              />
            </>
          )}
        </svg>

        <div
          className="mt-5 min-h-[18px] text-[11px] tracking-[0.14em] md:text-[12px]"
          style={{ fontFamily: VCR }}
          aria-live="polite"
        >
          {pressed ? (
            reduce ? (
              line
            ) : (
              <Typewriter
                key={n}
                speed={32}
                cursorBlinkRepeat={2}
                cursorStyle={{ background: '#fff' }}
              >
                {line}
              </Typewriter>
            )
          ) : (
            <span style={{ opacity: 0.6 }}>PRESSING…</span>
          )}
        </div>
        <div
          className="mt-6 grid grid-cols-3 gap-3 border-t pt-5 text-[11px] tracking-[0.12em]"
          style={{ borderColor: 'rgba(255,255,255,0.3)', fontFamily: VCR }}
        >
          <div>
            <div
              className="text-[28px] tracking-normal md:text-[36px]"
              style={{ fontFamily: DISPLAY, fontWeight: 500 }}
            >
              {worked}
            </div>
            DAYS WITH WORK
          </div>
          <div>
            <div
              className="text-[28px] tracking-normal md:text-[36px]"
              style={{ fontFamily: DISPLAY, fontWeight: 500 }}
            >
              212
            </div>
            THINGS MADE
          </div>
          <div>
            <div
              className="text-[28px] tracking-normal md:text-[36px]"
              style={{ fontFamily: DISPLAY, fontWeight: 500 }}
            >
              +8
            </div>
            SCORE, 12 WEEKS
          </div>
        </div>
      </div>

      <p className="mt-5 text-[14px] leading-[1.55]" style={{ color: 'var(--v-head-muted)' }}>
        Each cell is a day. The denser the dots, the more you made. Nothing here is posted for you;
        the plate is yours to share.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Btn
          kind="cta"
          onClick={() => toast('Image copied. Your record, in your finish.')}
          className="px-6"
        >
          Share your record
        </Btn>
        <Btn kind="secondary" onClick={() => go('today')}>
          Done for today
        </Btn>
        <Btn
          kind="quiet"
          onClick={() => {
            setPressed(false);
            setN((v) => v + 1);
          }}
          style={{ color: 'var(--v-head-muted)' }}
        >
          Replay
        </Btn>
      </div>
      <MockNote
        principle="Peak-end + compounding made visible + ownership. The session's last frame is a physical-feeling stamp on a record you own; the grid is the screenshot people post ('84 days on the record')."
        cut="The check-in modal and the old XP gains receipt (their job moves here and to the Standing moment)."
      />
    </div>
  );
}
