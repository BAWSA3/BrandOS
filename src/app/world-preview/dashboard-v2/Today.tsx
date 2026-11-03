'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';
import { useV2 } from './context';
import { MOVES, PERSONAS, RECORD } from './sample';
import { Btn, DISPLAY, Label, MockNote, Panel, VCR } from './ui';

/**
 * The daily next move. A calm screen with one suggestion drawn from the
 * member's Record; everything else is one tap away (rail, tabs, ⌘K).
 * First open asks one question: creator, founder or builder.
 *
 * Motion+ headline: the one number behind the move rolls up in Klein.
 */
/** Mounted once per move, so it always rolls up from 0 (AnimateNumber needs a change after mount). */
function RollStat({ value, suffix }: { value: number; suffix: string }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(value), reduce ? 0 : 320);
    return () => window.clearTimeout(t);
  }, [reduce, value]);
  return (
    <AnimateNumber
      className="text-[48px] leading-none md:text-[64px]"
      style={{
        fontFamily: DISPLAY,
        fontWeight: 500,
        letterSpacing: '-0.04em',
        color: 'var(--v-signal-text)',
      }}
      suffix={suffix}
      format={{ maximumFractionDigits: 1 }}
      transition={reduce ? { duration: 0 } : { type: 'spring', duration: 1.1, bounce: 0 }}
    >
      {shown}
    </AnimateNumber>
  );
}

export default function Today({ firstRun }: { firstRun: boolean }) {
  const { persona, setPersona, go, toast } = useV2();
  const reduce = useReducedMotion();
  const [asking, setAsking] = useState(firstRun || !persona);
  const [i, setI] = useState(0);
  const moves = MOVES[persona ?? 'creator'];
  const move = moves[i % moves.length];

  return (
    <div className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-[880px] flex-col px-4 pt-8 md:min-h-screen md:px-10 md:pt-20">
      <Label tone="head-muted">Tuesday 27 Oct 2026 / Day 9 of your run</Label>
      <AnimatePresence mode="wait" initial={false}>
        {asking ? (
          <motion.div
            key="ask"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -6 }}
            transition={{ duration: 0.24 }}
            className="mt-6"
          >
            <h1
              className="text-[40px] leading-[1.02] md:text-[64px]"
              style={{
                fontFamily: DISPLAY,
                fontWeight: 500,
                letterSpacing: '-0.04em',
                color: 'var(--v-head)',
              }}
            >
              Welcome in, {RECORD.name}.
              <br />
              <span style={{ color: 'var(--v-head-muted)' }}>Which one are you?</span>
            </h1>
            <div className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-3">
              {PERSONAS.map((p) => (
                <motion.button
                  key={p.id}
                  type="button"
                  whileTap={reduce ? undefined : { scale: 0.98 }}
                  onClick={() => {
                    setPersona(p.id);
                    setI(0);
                    setAsking(false);
                  }}
                  className="v2-focus min-h-[88px] p-5 text-left"
                  style={{
                    background: 'var(--v-surface)',
                    color: 'var(--v-ink)',
                    borderRadius: 18,
                    boxShadow:
                      persona === p.id
                        ? 'inset 0 0 0 2px var(--v-signal)'
                        : 'inset 0 0 0 1px var(--v-rule)',
                  }}
                >
                  <div
                    className="text-[22px]"
                    style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: '-0.02em' }}
                  >
                    {p.name}
                  </div>
                  <div className="mt-1 text-[14px]" style={{ color: 'var(--v-muted)' }}>
                    {p.line}
                  </div>
                </motion.button>
              ))}
            </div>
            <p className="mt-4 text-[13px]" style={{ color: 'var(--v-head-muted)' }}>
              One tap. It changes the examples and the moves, nothing else. Change it any time in
              Settings.
            </p>
          </motion.div>
        ) : (
          <motion.div
            key={`move-${persona}-${i}`}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
            className="mt-4"
          >
            <p
              className="text-[18px]"
              style={{ color: 'var(--v-head-muted)', fontFamily: DISPLAY }}
            >
              Morning, {RECORD.name}. One move today.
            </p>
            <Panel className="mt-6 p-6 md:p-10" style={{ borderRadius: 24 }}>
              <Label>Today&apos;s move</Label>
              <h1
                className="mt-4 text-[34px] leading-[1.04] md:text-[56px]"
                style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: '-0.04em' }}
              >
                {move.title}
              </h1>
              <div className="mt-6 flex items-baseline gap-3">
                <RollStat value={move.stat.value} suffix={move.stat.suffix} />
                <span className="text-[15px]" style={{ color: 'var(--v-muted)' }}>
                  {move.stat.label}
                </span>
              </div>
              <p className="mt-4 max-w-[620px] text-[17px] leading-[1.55]">{move.why}</p>
              <Label className="mt-5">{move.source}</Label>
              <div className="mt-8 flex flex-wrap items-center gap-2">
                <Btn
                  kind="primary"
                  onClick={() => go(move.action.to)}
                  className="w-full px-6 text-[15px] md:w-auto"
                >
                  {move.action.label} →
                </Btn>
                <Btn kind="quiet" onClick={() => setI((n) => n + 1)}>
                  Show another
                </Btn>
                <Btn
                  kind="quiet"
                  onClick={() =>
                    toast('Saved for tomorrow. Today stays open.', () => toast('Back on today.'))
                  }
                >
                  Later
                </Btn>
              </div>
            </Panel>

            {/* Open loops: gentle, never a red badge */}
            <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => go('canvas')}
                className="v2-focus flex min-h-[56px] items-center justify-between px-5 text-left text-[15px]"
                style={{
                  borderRadius: 16,
                  boxShadow: 'inset 0 0 0 1px var(--v-rule)',
                  background: 'var(--v-surface)',
                  color: 'var(--v-ink)',
                }}
              >
                <span>
                  2 ideas half-built
                  <span style={{ color: 'var(--v-muted)' }}> · waiting on the canvas</span>
                </span>
                <span aria-hidden style={{ color: 'var(--v-muted)' }}>
                  →
                </span>
              </button>
              <button
                type="button"
                onClick={() => go('playbook')}
                className="v2-focus flex min-h-[56px] items-center justify-between px-5 text-left text-[15px]"
                style={{
                  borderRadius: 16,
                  boxShadow: 'inset 0 0 0 1px var(--v-rule)',
                  background: 'var(--v-surface)',
                  color: 'var(--v-ink)',
                }}
              >
                <span>
                  Score 72
                  <span style={{ color: 'var(--v-muted)' }}> · up 2 since 14 Oct</span>
                </span>
                <span aria-hidden style={{ color: 'var(--v-muted)' }}>
                  →
                </span>
              </button>
            </div>
            <p
              className="mt-8 hidden text-[13px] md:block"
              style={{ color: 'var(--v-head-muted)' }}
            >
              Anything else: press{' '}
              <span style={{ fontFamily: VCR, color: 'var(--v-head)' }}>⌘K</span>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex-1" />
      <MockNote
        principle="Remove the blank page + choice reduction. One suggestion from the member's own Record, one Klein action; open loops shown as a gentle count."
        cut="The 12-tile report as the first screen (score, growth, history, posts, formats, next moves, lookups, competitors, audience, Index, idea board). All still one tap away."
      />
    </div>
  );
}
