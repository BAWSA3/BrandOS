'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';
import { useV2 } from './context';
import { DRAFT } from './sample';
import { Btn, DISPLAY, Kbd, Label, MockNote, VCR } from './ui';

/**
 * The writing room: one idea at a time, distraction-free, with BrandOS
 * reading beside it. Today's copywriter (as a quiet "ask" line) and draft
 * scoring move here. Desktop: editor + side reading. Phone: full-screen
 * editor, the reading as a bottom sheet that peeks.
 *
 * Keys: ⌘↵ score · ⌘. hide the reading · Esc back to the Playbook.
 * Motion+ headline: the fit score rolls up in Klein when scored.
 */

const SHARP_FIRST = `31 of 40 brands told me they scroll a creator's profile for 10 seconds. part two.`;

function Reading({
  scored,
  fit,
  onScore,
  onApply,
  applied,
}: {
  scored: boolean;
  fit: number;
  onScore: () => void;
  onApply: () => void;
  applied: boolean;
}) {
  const reduce = useReducedMotion();
  const s = DRAFT.score;
  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>BrandOS reads</Label>
        {scored && (
          <span className="text-[12px]" style={{ color: 'var(--v-muted)' }}>
            vs your last 41 posts
          </span>
        )}
      </div>
      {!scored ? (
        <div className="mt-4">
          <p className="text-[15px] leading-[1.5]" style={{ color: 'var(--v-muted)' }}>
            Fit, hook, format and whether it sounds like you, before it goes out.
          </p>
          <Btn kind="primary" onClick={onScore} className="mt-4 w-full" kbd="⌘↵">
            Score this draft
          </Btn>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-baseline gap-2">
            <AnimateNumber
              className="text-[72px] leading-none"
              style={{
                fontFamily: DISPLAY,
                fontWeight: 500,
                letterSpacing: '-0.05em',
                color: 'var(--v-signal-text)',
              }}
              transition={reduce ? { duration: 0 } : { type: 'spring', duration: 1.1, bounce: 0 }}
            >
              {fit}
            </AnimateNumber>
            <span className="text-[12px]" style={{ fontFamily: VCR, color: 'var(--v-muted)' }}>
              FIT /100
            </span>
          </div>
          <dl className="mt-5 space-y-3 text-[14px]">
            <div>
              <div className="flex justify-between">
                <dt>Sounds like you</dt>
                <dd style={{ fontFamily: VCR }}>{s.voice}%</dd>
              </div>
              <div
                className="mt-1.5 h-[5px]"
                style={{ background: 'var(--v-track)', borderRadius: 4 }}
              >
                <div
                  className="h-full"
                  style={{ width: `${s.voice}%`, background: 'var(--v-ink)', borderRadius: 4 }}
                />
              </div>
            </div>
            <div
              className="flex justify-between border-t pt-3"
              style={{ borderColor: 'var(--v-rule)' }}
            >
              <dt>Hook</dt>
              <dd>{applied ? 'Strong' : 'Buried'}</dd>
            </div>
            <div
              className="flex justify-between border-t pt-3"
              style={{ borderColor: 'var(--v-rule)' }}
            >
              <dt>Format</dt>
              <dd>
                {s.format} · {s.lift}× your usual
              </dd>
            </div>
            <div
              className="flex justify-between border-t pt-3"
              style={{ borderColor: 'var(--v-rule)' }}
            >
              <dt>Likely reach</dt>
              <dd>{s.reach} your normal</dd>
            </div>
          </dl>
          <AnimatePresence initial={false}>
            {!applied && (
              <motion.div
                initial={false}
                exit={reduce ? undefined : { opacity: 0, height: 0 }}
                className="mt-5 p-4"
                style={{ background: 'var(--v-soft)', borderRadius: 14 }}
              >
                <Label tone="signal">One fix</Label>
                <p className="mt-2 text-[14px] leading-[1.5]">{s.fix}</p>
                <Btn kind="secondary" onClick={onApply} className="mt-3">
                  Apply it
                </Btn>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      <div className="mt-6 border-t pt-4" style={{ borderColor: 'var(--v-rule)' }}>
        <label className="text-[13px]" style={{ color: 'var(--v-muted)' }} htmlFor="ask">
          Ask the copywriter
        </label>
        <input
          id="ask"
          placeholder="shorter · make it a thread · write 3 hooks"
          className="v2-focus mt-2 h-[44px] w-full px-3 text-[14px]"
          style={{
            border: 'none',
            padding: '0 12px',
            background: 'var(--v-raised)',
            color: 'var(--v-ink)',
            borderRadius: 12,
            boxShadow: 'inset 0 0 0 1px var(--v-rule)',
          }}
        />
      </div>
    </div>
  );
}

export default function Writing() {
  const { go, toast, earn } = useV2();
  const [text, setText] = useState(DRAFT.text);
  const [scored, setScored] = useState(false);
  const [fit, setFit] = useState(0);
  const [applied, setApplied] = useState(false);
  const [side, setSide] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [saved, setSaved] = useState('Saved');
  const reduce = useReducedMotion();
  const ref = useRef<HTMLTextAreaElement>(null);

  const score = () => {
    setScored(true);
    setFit(0);
    window.setTimeout(() => setFit(applied ? 86 : DRAFT.score.fit), reduce ? 0 : 140);
  };
  const apply = () => {
    const before = text;
    const lines = text.split('\n');
    lines[0] = SHARP_FIRST;
    setText(lines.join('\n'));
    setApplied(true);
    setFit(86);
    toast('Hook moved to the top.', () => {
      setText(before);
      setApplied(false);
      setFit(DRAFT.score.fit);
    });
  };
  const posted = () => {
    earn(40);
    go('standing');
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        score();
      } else if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        setSide((v) => !v);
      } else if (e.key === 'Escape' && !(e.target as HTMLElement).closest('[role=dialog]')) {
        go('playbook');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const words = text.trim().split(/\s+/).length;

  return (
    <div className="min-h-screen">
      {/* Slim top bar: the only chrome in the room */}
      <div className="flex h-[56px] items-center justify-between px-3 md:px-8">
        <Btn kind="quiet" onClick={() => go('playbook')} style={{ color: 'var(--v-head-muted)' }}>
          ← Playbook
        </Btn>
        <div
          className="hidden items-center gap-3 text-[12px] md:flex"
          style={{ color: 'var(--v-head-muted)' }}
        >
          <span>{saved}</span>
          <span aria-hidden>·</span>
          <span>
            <Kbd>⌘.</Kbd> focus
          </span>
        </div>
        <div className="md:hidden">
          <Btn kind="secondary" onClick={() => setSheet(true)}>
            {scored ? `Fit ${fit}` : 'Score'}
          </Btn>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1180px] gap-10 px-4 md:px-8">
        <div className="mx-auto w-full max-w-[680px] flex-1 pb-40 pt-4 md:pt-12">
          <Label tone="head-muted">Idea · from today&apos;s move</Label>
          <h1
            className="mt-3 text-[28px] leading-[1.1] md:text-[40px]"
            style={{
              fontFamily: DISPLAY,
              fontWeight: 500,
              letterSpacing: '-0.03em',
              color: 'var(--v-head)',
            }}
          >
            {DRAFT.idea}
          </h1>
          <div
            className="mt-6 p-5 md:mt-8 md:p-8"
            style={{
              background: 'var(--v-surface)',
              borderRadius: 20,
              boxShadow: 'inset 0 0 0 1px var(--v-rule)',
            }}
          >
            <textarea
              ref={ref}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setSaved('Saving…');
                window.setTimeout(() => setSaved('Saved'), 500);
              }}
              aria-label="Draft"
              rows={12}
              className="w-full resize-none bg-transparent text-[18px] leading-[1.65] outline-none md:text-[19px]"
              style={{
                color: 'var(--v-ink)',
                fontFamily: DISPLAY,
                background: 'transparent',
                border: 'none',
                padding: 0,
                borderRadius: 0,
                boxShadow: 'none',
              }}
            />
            <div
              className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-4"
              style={{ borderColor: 'var(--v-rule)' }}
            >
              <div className="flex gap-1">
                {['Post', 'Thread', 'Long post', 'Article'].map((f) => (
                  <button
                    key={f}
                    type="button"
                    className="v2-focus min-h-[36px] px-3 text-[13px]"
                    style={{
                      borderRadius: 999,
                      color: f === 'Thread' ? 'var(--v-ink)' : 'var(--v-muted)',
                      boxShadow: f === 'Thread' ? 'inset 0 0 0 1px var(--v-ink)' : 'none',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <span className="text-[12px]" style={{ fontFamily: VCR, color: 'var(--v-muted)' }}>
                {words} WORDS
              </span>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <Btn kind="cta" onClick={posted} className="px-6">
              Open in X, then mark posted
            </Btn>
            <Btn
              kind="quiet"
              onClick={() => toast('Back on the canvas as a draft.')}
              style={{ color: 'var(--v-head-muted)' }}
            >
              Park it
            </Btn>
          </div>
        </div>

        {/* Desktop reading */}
        <AnimatePresence initial={false}>
          {side && (
            <motion.aside
              initial={reduce ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduce ? undefined : { opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              className="sticky top-6 hidden h-fit w-[320px] shrink-0 p-6 md:mt-12 md:block"
              style={{
                background: 'var(--v-surface)',
                color: 'var(--v-ink)',
                borderRadius: 20,
                boxShadow: 'inset 0 0 0 1px var(--v-rule)',
              }}
            >
              <Reading
                scored={scored}
                fit={fit}
                onScore={score}
                onApply={apply}
                applied={applied}
              />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Phone: the reading peeks from the bottom */}
      <div className="md:hidden">
        <button
          type="button"
          data-shot="peek"
          onClick={() => setSheet(true)}
          className="v2-focus fixed inset-x-0 bottom-0 z-30 flex min-h-[64px] items-center justify-between px-5"
          style={{
            background: 'var(--v-surface)',
            color: 'var(--v-ink)',
            boxShadow: '0 -1px 0 var(--v-rule)',
            borderRadius: '20px 20px 0 0',
          }}
        >
          <span className="text-[15px]">
            {scored ? (
              <>
                Fit <span style={{ color: 'var(--v-signal-text)' }}>{fit}</span> · sounds like you{' '}
                {DRAFT.score.voice}%
              </>
            ) : (
              'Score this draft'
            )}
          </span>
          <span aria-hidden style={{ color: 'var(--v-muted)' }}>
            ↑
          </span>
        </button>
        <AnimatePresence>
          {sheet && (
            <>
              <motion.div
                key="scrim"
                className="fixed inset-0 z-40"
                style={{ background: 'var(--v-scrim)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSheet(false)}
              />
              <motion.div
                key="sheet"
                role="dialog"
                aria-label="BrandOS reading"
                className="fixed inset-x-0 bottom-0 z-50 max-h-[82vh] overflow-auto p-5 pb-8"
                style={{
                  background: 'var(--v-surface)',
                  color: 'var(--v-ink)',
                  borderRadius: '22px 22px 0 0',
                }}
                initial={reduce ? false : { y: '100%' }}
                animate={{ y: 0 }}
                exit={reduce ? undefined : { y: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 36 }}
              >
                <div
                  className="mx-auto mb-4 h-1 w-10"
                  style={{ background: 'var(--v-rule)', borderRadius: 4 }}
                />
                <Reading
                  scored={scored}
                  fit={fit}
                  onScore={score}
                  onApply={apply}
                  applied={applied}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      <MockNote
        principle="Choice reduction + fast feedback. One idea, one editor, one Klein action; scoring sits beside the words and answers in place; autosave is a quiet word, every change has undo."
        cut="The copywriter as a separate chat page with format tabs and canned prompts (it becomes one 'Ask' line); X-composer chrome on ideas (avatar, fake toolbar icons)."
      />
    </div>
  );
}
