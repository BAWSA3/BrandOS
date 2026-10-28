'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';
import { X } from './XComposer';

/**
 * "Score this draft": scores a post before it goes out, against the member's
 * own brand and history (/api/dashboard/draft-score). Used under the idea
 * board's composer and on the copywriter's post and thread drafts.
 *
 * The headline moment is the Klein score rolling up (AnimateNumber); the rest
 * is still. Measured fixes (from their own numbers) are marked as such.
 * Nothing here posts to X: "Open in X" hands the text to X's own composer.
 */

export interface DraftScoreResult {
  score: number;
  verdict: string;
  format: string;
  formatLift: number | null;
  reach: { low: number; high: number } | null;
  fixes: { text: string; source: 'data' | 'model' }[];
  voice: string;
  hook: string;
  why: string;
  basedOn: number;
}

const MONO = 'var(--d-mono, "JetBrains Mono", ui-monospace, monospace)';

export default function DraftScore({
  text,
  accountId,
  demo,
}: {
  text: string;
  /** The tracked brand the draft is for (default: their own X account). */
  accountId?: string;
  /** Preview only: show this result instead of calling the API. */
  demo?: DraftScoreResult;
}) {
  const reduce = useReducedMotion();
  const [hasMedia, setHasMedia] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DraftScoreResult | null>(null);
  const [scoredText, setScoredText] = useState<string | null>(null);
  const [shown, setShown] = useState(0);

  // the number rolls up from 0 once per new result
  useEffect(() => {
    if (!result) return;
    const t = window.setTimeout(() => setShown(result.score), reduce ? 0 : 120);
    return () => window.clearTimeout(t);
  }, [result, reduce]);

  const trimmed = text.trim();
  const stale = result !== null && scoredText !== `${hasMedia}\n${trimmed}`;

  async function score() {
    if (busy || trimmed.length < 12) return;
    setBusy(true);
    setError(null);
    try {
      let next: DraftScoreResult;
      if (demo) {
        await new Promise((r) => setTimeout(r, 600));
        next = demo;
      } else {
        const res = await fetch('/api/dashboard/draft-score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: trimmed,
            hasMedia,
            tzOffsetMin: -new Date().getTimezoneOffset(),
            ...(accountId ? { account: accountId } : {}),
          }),
        });
        const json = (await res.json().catch(() => ({}))) as DraftScoreResult & { error?: string };
        if (!res.ok) throw new Error(json.error || 'Scoring failed. Try again.');
        next = json;
      }
      setShown(0);
      setResult(next);
      setScoredText(`${hasMedia}\n${trimmed}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scoring failed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  const tooShort = trimmed.length < 12;

  return (
    <div className="mt-3" style={{ fontFamily: X.font, color: X.ink }}>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={score}
          disabled={busy || tooShort}
          className="rounded-full border px-4 text-[14px] font-bold leading-8 transition-colors disabled:opacity-50"
          style={{ borderColor: X.blue, color: X.blue, background: X.surface }}
          title={tooShort ? 'Write a little more first' : undefined}
        >
          {busy ? 'Scoring…' : result && !stale ? 'Re-score' : 'Score this draft'}
        </button>
        <label className="flex items-center gap-1.5 text-[13px]" style={{ color: X.muted }}>
          <input
            type="checkbox"
            checked={hasMedia}
            onChange={(e) => setHasMedia(e.target.checked)}
            className="h-3.5 w-3.5"
            style={{ accentColor: X.blue }}
          />
          With an image or video
        </label>
        {stale && (
          <span className="text-[12px]" style={{ color: X.muted }}>
            Edited since the last score
          </span>
        )}
      </div>

      {error && (
        <div className="mt-2 text-[13px]" role="alert" style={{ color: X.over }}>
          {error}
        </div>
      )}

      {result && (
        <section
          aria-label="Draft score"
          className="mt-3 border px-4 py-3"
          style={{ borderColor: X.rule, background: X.surface, opacity: stale ? 0.55 : 1 }}
        >
          <div className="flex items-end justify-between gap-3">
            <div className="flex items-baseline gap-1.5">
              <AnimateNumber
                className="text-[44px] font-bold leading-none tabular-nums"
                style={{ color: X.blue, letterSpacing: '-0.03em' }}
                transition={reduce ? { duration: 0 } : undefined}
              >
                {shown}
              </AnimateNumber>
              <span className="text-[13px]" style={{ color: X.muted }}>
                /100
              </span>
              <span className="sr-only">Draft score {result.score} out of 100.</span>
            </div>
            <div
              className="text-right text-[10px] uppercase tracking-[0.14em]"
              style={{ fontFamily: MONO, color: X.muted }}
            >
              {result.verdict}
              <br />
              {result.format}
              {result.formatLift !== null && ` · ${result.formatLift}× your average`}
            </div>
          </div>

          {result.reach && (
            <div className="mt-2 text-[14px] leading-5">
              Likely{' '}
              <strong>
                {result.reach.low === result.reach.high
                  ? `${result.reach.low}×`
                  : `${result.reach.low}–${result.reach.high}×`}
              </strong>{' '}
              your usual views
              <span style={{ color: X.muted }}> · from your last {result.basedOn} posts</span>
            </div>
          )}

          {result.fixes.length > 0 && (
            <ol className="mt-3 space-y-1.5">
              {result.fixes.map((f, i) => (
                <li key={i} className="flex gap-2 text-[14px] leading-5">
                  <span className="tabular-nums" style={{ color: X.blue }}>
                    {i + 1}.
                  </span>
                  <span>
                    {f.text}
                    {f.source === 'data' && (
                      <span
                        className="ml-1.5 text-[9px] uppercase tracking-[0.14em]"
                        style={{ fontFamily: MONO, color: X.muted }}
                      >
                        measured
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ol>
          )}

          {(result.voice || result.hook) && (
            <div className="mt-3 space-y-1 text-[13px] leading-[18px]" style={{ color: X.muted }}>
              {result.voice && <div>Voice: {result.voice}</div>}
              {result.hook && <div>Hook: {result.hook}</div>}
            </div>
          )}

          <div className="mt-3 flex justify-end">
            <a
              href={`https://x.com/intent/post?text=${encodeURIComponent(trimmed.slice(0, 2000))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-bold hover:underline"
              style={{ color: X.blue }}
            >
              Open in X →
            </a>
          </div>
        </section>
      )}
    </div>
  );
}
