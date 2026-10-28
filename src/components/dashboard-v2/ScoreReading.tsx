'use client';

import { useCallback, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';
import type { DraftScoreResult } from '@/components/growth/DraftScore';
import { Btn, DISPLAY, Label, VCR } from './ui';

/**
 * "Score this draft" for the writing room, shared by Post/Thread and Article
 * mode: /api/dashboard/draft-score (12–2,000 characters). The Motion+ headline
 * is the fit score rolling up in Klein; reduced motion shows it at once.
 */

export const SCORE_MIN = 12;
export const SCORE_MAX = 2000;

export function useDraftScore({
  accountId,
  demo,
}: {
  accountId: string | null;
  demo?: DraftScoreResult;
}) {
  const reduce = useReducedMotion();
  const [score, setScore] = useState<DraftScoreResult | null>(null);
  const [scoredText, setScoredText] = useState<string | null>(null);
  const [shown, setShown] = useState(0);
  const [scoring, setScoring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (scoring || text.length < SCORE_MIN || [...text].length > SCORE_MAX) return;
      setScoring(true);
      setError(null);
      try {
        let next: DraftScoreResult;
        if (demo) {
          await new Promise((r) => setTimeout(r, 400));
          next = demo;
        } else {
          const res = await fetch('/api/dashboard/draft-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text,
              tzOffsetMin: -new Date().getTimezoneOffset(),
              ...(accountId ? { account: accountId } : {}),
            }),
          });
          const json = (await res.json().catch(() => ({}))) as DraftScoreResult & {
            error?: string;
          };
          if (!res.ok) throw new Error(json.error || 'Scoring failed. Try again.');
          next = json;
        }
        setShown(0);
        setScore(next);
        setScoredText(text);
        window.setTimeout(() => setShown(next.score), reduce ? 0 : 120);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Scoring failed. Try again.');
      } finally {
        setScoring(false);
      }
    },
    [accountId, demo, reduce, scoring]
  );

  const clear = useCallback(() => {
    setScore(null);
    setScoredText(null);
  }, []);

  return { score, scoredText, shown, scoring, error, run, clear };
}

export function ScoreReading({
  state,
  text,
  what = 'draft',
}: {
  state: ReturnType<typeof useDraftScore>;
  /** the text the score is for (the draft, or the open article section) */
  text: string;
  what?: 'draft' | 'section';
}) {
  const reduce = useReducedMotion();
  const { score, scoredText, shown, scoring, run } = state;
  const trimmed = text.trim();
  const len = [...trimmed].length;
  const stale = score !== null && scoredText !== trimmed;
  const tooLong = len > SCORE_MAX;

  return (
    <div>
      <div className="flex items-center justify-between">
        <Label>BrandOS reads</Label>
        {score && !stale && (
          <span className="text-[12px]" style={{ color: 'var(--v-muted)' }}>
            vs your last {score.basedOn} posts
          </span>
        )}
      </div>
      {!score ? (
        <div className="mt-4">
          <p className="text-[15px] leading-[1.5]" style={{ color: 'var(--v-muted)' }}>
            {what === 'section'
              ? 'Fit, hook and whether the open section sounds like you.'
              : 'Fit, hook, format and whether it sounds like you, before it goes out.'}
          </p>
          <Btn
            kind="primary"
            onClick={() => void run(trimmed)}
            disabled={scoring || len < SCORE_MIN || tooLong}
            className="mt-4 w-full"
          >
            {scoring ? 'Reading…' : what === 'section' ? 'Score this section' : 'Score this draft'}
            <span className="hidden text-[10px] opacity-70 md:inline" style={{ fontFamily: VCR }}>
              ⌘↵
            </span>
          </Btn>
          {len < SCORE_MIN && (
            <p className="mt-2 text-[12px]" style={{ color: 'var(--v-muted)' }}>
              Write a line or two first.
            </p>
          )}
          {tooLong && (
            <p className="mt-2 text-[12px]" style={{ color: 'var(--v-muted)' }}>
              Scoring reads up to {SCORE_MAX.toLocaleString('en-US')} characters. This one is{' '}
              {len.toLocaleString('en-US')}: split it, or trim it first.
            </p>
          )}
        </div>
      ) : (
        <div className="mt-4" style={{ opacity: stale ? 0.55 : 1 }}>
          <div className="flex items-baseline gap-2">
            <AnimateNumber
              className="text-[64px] leading-none md:text-[72px]"
              style={{
                fontFamily: DISPLAY,
                fontWeight: 500,
                letterSpacing: '-0.05em',
                color: 'var(--v-signal-text)',
              }}
              transition={reduce ? { duration: 0 } : { type: 'spring', duration: 1.1, bounce: 0 }}
            >
              {shown}
            </AnimateNumber>
            <span className="text-[12px]" style={{ fontFamily: VCR, color: 'var(--v-muted)' }}>
              FIT /100
            </span>
          </div>
          <p className="mt-2 text-[15px] leading-[1.45]">{score.verdict}</p>
          <dl className="mt-4 space-y-3 text-[14px]">
            {[
              ['Voice', score.voice],
              ['Hook', score.hook],
              ...(what === 'draft'
                ? [
                    [
                      'Format',
                      `${score.format}${score.formatLift ? ` · ${score.formatLift.toFixed(1)}× your usual` : ''}`,
                    ],
                    ...(score.reach
                      ? [['Likely reach', `${score.reach.low}–${score.reach.high}× your normal`]]
                      : []),
                  ]
                : []),
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex justify-between gap-4 border-t pt-3"
                style={{ borderColor: 'var(--v-rule)' }}
              >
                <dt>{k}</dt>
                <dd className="text-right" style={{ color: 'var(--v-muted)' }}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>
          {score.fixes[0] && (
            <div className="mt-5 p-4" style={{ background: 'var(--v-soft)', borderRadius: 14 }}>
              <Label tone="signal">
                {score.fixes[0].source === 'data' ? 'One fix / from your numbers' : 'One fix'}
              </Label>
              <p className="mt-2 text-[14px] leading-[1.5]">{score.fixes[0].text}</p>
              {score.fixes.length > 1 && (
                <details className="mt-2 text-[13px]" style={{ color: 'var(--v-muted)' }}>
                  <summary className="v2-focus cursor-pointer">
                    {score.fixes.length - 1} more
                  </summary>
                  <ul className="mt-2 space-y-1.5">
                    {score.fixes.slice(1).map((f) => (
                      <li key={f.text}>{f.text}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
          {stale && (
            <Btn
              kind="secondary"
              onClick={() => void run(trimmed)}
              disabled={scoring || tooLong || len < SCORE_MIN}
              className="mt-4 w-full"
            >
              {scoring
                ? 'Reading…'
                : `Re-score the new ${what === 'section' ? 'section' : 'version'}`}
            </Btn>
          )}
        </div>
      )}
      {state.error && (
        <p role="alert" className="mt-3 text-[13px]">
          {state.error}
        </p>
      )}
    </div>
  );
}
