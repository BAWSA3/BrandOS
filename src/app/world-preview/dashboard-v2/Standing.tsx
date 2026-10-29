'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';
import { useV2 } from './context';
import { RECORD, WEEKS } from './sample';
import { Btn, DISPLAY, Label, MockNote, Panel, VCR } from './ui';

/**
 * The XP / level moment, after "mark posted". Calm and earned: the Standing
 * total counts up, the level bar settles, the run is a row of filled days
 * (no flames, no "don't lose it"). The frame is the body of work, not points.
 * A second state shows an advancement (level 8 + rank II), pressed like a stamp.
 */
export default function Standing() {
  const { go, earned } = useV2();
  const reduce = useReducedMotion();
  const gain = earned || 40;
  const s = RECORD.standing;
  const [total, setTotal] = useState(s.total);
  const [into, setInto] = useState(s.into);
  const [advance, setAdvance] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(
      () => {
        setTotal(s.total + gain + (advance ? 160 : 0));
        setInto(advance ? 0 : s.into + gain);
      },
      reduce ? 0 : 450
    );
    return () => window.clearTimeout(t);
  }, [advance, gain, reduce, s.into, s.total]);

  const level = advance ? s.level + 1 : s.level;
  const need = advance ? 2000 : s.need;
  const posts = WEEKS.reduce((a, w) => a + w.posts, 0);

  return (
    <div className="mx-auto flex min-h-[calc(100vh-56px)] w-full max-w-[640px] flex-col px-4 pt-10 md:min-h-screen md:pt-24">
      <Label tone="head-muted">Posted / 27 Oct 2026 / 14:32</Label>
      <h1
        className="mt-4 text-[36px] leading-[1.05] md:text-[52px]"
        style={{
          fontFamily: DISPLAY,
          fontWeight: 500,
          letterSpacing: '-0.04em',
          color: 'var(--v-head)',
        }}
      >
        Part two is out.
        <br />
        <span style={{ color: 'var(--v-head-muted)' }}>
          That&apos;s {posts + 1} posts on the record.
        </span>
      </h1>

      <Panel className="mt-8 p-6 md:p-8" style={{ borderRadius: 24 }}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Label>Standing</Label>
            <div className="mt-2 flex items-baseline gap-3">
              <AnimateNumber
                className="text-[56px] leading-none md:text-[72px]"
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 500,
                  letterSpacing: '-0.05em',
                  color: 'var(--v-signal-text)',
                }}
                format={{ useGrouping: true }}
                transition={reduce ? { duration: 0 } : { type: 'spring', duration: 1.4, bounce: 0 }}
              >
                {total}
              </AnimateNumber>
              <span className="text-[15px]" style={{ color: 'var(--v-muted)' }}>
                +{gain} for shipping it
              </span>
            </div>
          </div>
          <motion.div
            key={level}
            initial={reduce || !advance ? false : { scale: 1.12, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.42, ease: 'easeOut' }}
            className="flex h-[72px] w-[72px] shrink-0 flex-col items-center justify-center"
            style={{
              borderRadius: 999,
              background: advance ? 'var(--v-signal)' : 'transparent',
              color: advance ? 'var(--v-on-signal)' : 'var(--v-ink)',
              boxShadow: advance
                ? 'inset 0 -3px 6px rgba(0,0,0,0.18)'
                : 'inset 0 0 0 1px var(--v-rule)',
            }}
            aria-label={`Level ${level}`}
          >
            <span
              className="text-[9px] tracking-[0.16em]"
              style={{ fontFamily: VCR, opacity: 0.8 }}
            >
              LEVEL
            </span>
            <span
              className="text-[28px] leading-none"
              style={{ fontFamily: DISPLAY, fontWeight: 500 }}
            >
              {level}
            </span>
          </motion.div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between text-[13px]" style={{ color: 'var(--v-muted)' }}>
            <span>Level {level}</span>
            <span>
              {Math.max(0, need - into).toLocaleString()} to level {level + 1}
            </span>
          </div>
          <div
            className="mt-2 h-[8px] overflow-hidden"
            style={{ background: 'var(--v-track)', borderRadius: 99 }}
          >
            <motion.div
              className="h-full"
              initial={{ width: `${(s.into / s.need) * 100}%` }}
              animate={{ width: `${(into / need) * 100}%` }}
              transition={
                reduce
                  ? { duration: 0 }
                  : { type: 'spring', stiffness: 90, damping: 20, delay: 0.2 }
              }
              style={{ background: 'var(--v-ink)', borderRadius: 99 }}
            />
          </div>
        </div>

        <div className="mt-6 border-t pt-5" style={{ borderColor: 'var(--v-rule)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[14px]">{s.run}-day run</span>
            <span className="text-[13px]" style={{ color: 'var(--v-muted)' }}>
              Rank {advance ? 'III · Established' : `${s.rank} · ${s.rankName}`}
            </span>
          </div>
          <div className="mt-3 flex gap-1.5" aria-hidden>
            {Array.from({ length: 14 }, (_, i) => (
              <span
                key={i}
                className="h-[14px] flex-1"
                style={{
                  borderRadius: 4,
                  background:
                    i < s.run
                      ? i === s.run - 1
                        ? 'var(--v-signal)'
                        : 'var(--v-ink)'
                      : 'var(--v-track)',
                  opacity: i < s.run - 1 ? 0.8 : 1,
                }}
              />
            ))}
          </div>
          <p className="mt-3 text-[13px] leading-[1.5]" style={{ color: 'var(--v-muted)' }}>
            Miss a day and the run rests; your Standing never drops.
          </p>
        </div>

        <p className="mt-6 text-[16px] leading-[1.5]">
          {advance
            ? 'Level 8. Your body of work is three times what it was in September.'
            : 'This month: 20 posts, 6 scored 80+. Your body of work is three times what it was in September.'}
        </p>
      </Panel>

      <div className="mt-6 flex flex-wrap gap-2">
        <Btn kind="cta" onClick={() => go('press')} className="px-6">
          Press today into your Record →
        </Btn>
        <Btn
          kind="quiet"
          onClick={() => setAdvance((v) => !v)}
          style={{ color: 'var(--v-head-muted)' }}
        >
          {advance ? 'Show the usual day' : 'Show an advancement'}
        </Btn>
      </div>
      <div className="flex-1" />
      <MockNote
        principle="Peak-end + compounding made visible. The session ends on a counted win, framed as work on the record; the run is calm (it rests, it never resets Standing)."
        cut="The arcade XP bar and the per-gain receipt list under it; streak-loss alerts; 'level up' language (BRAND-WORLD rules)."
      />
    </div>
  );
}
