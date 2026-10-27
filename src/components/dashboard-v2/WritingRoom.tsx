'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';
import type { DraftScoreResult } from '@/components/growth/DraftScore';
import { Btn, DISPLAY, Label, Panel, VCR } from './ui';

/**
 * The writing room (dashboard v2, slice 4): one idea at a time, distraction-
 * free, with BrandOS reading beside it. The copywriter and draft scoring move
 * here from their own page and the idea board. Same routes as before:
 *   /api/dashboard/copywriter  (streamed options, "---" separated)
 *   /api/dashboard/draft-score (fit, voice, hook, format, reach band, fixes)
 *   /api/ideas                 (save to the board, mark drafting / posted)
 * The draft autosaves on this device; "Save to board" puts it in the record.
 *
 * Keys: ⌘↵ score · ⌘. hide the reading. Motion+ headline: the fit score rolls.
 */

type Format = 'x-post' | 'thread';
type Msg = { role: 'user' | 'assistant'; content: string };

const KEY = 'brandos:room-draft';
const XLIMIT = 280;

function splitOptions(text: string): string[] {
  return text
    .split(/^\s*---\s*$/m)
    .map((s) => s.trim().replace(/^Option \d+\s*\n/, ''))
    .filter(Boolean);
}

// the draft on this device (useSyncExternalStore: no flash, no setState-in-effect)
const listeners = new Set<() => void>();
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function readDraft(): string {
  try {
    return window.localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}
function writeDraft(v: string) {
  try {
    window.localStorage.setItem(KEY, v);
  } catch {
    // storage blocked: the draft lives in this tab only
  }
  listeners.forEach((l) => l());
}

export default function WritingRoom({
  idea,
  accountId,
  handle,
  demo,
}: {
  /** the move or idea this room opened on (from ?prompt=), or null */
  idea: string | null;
  /** the member's own brand (tracked account), for scoring and the board */
  accountId: string | null;
  handle: string | null;
  /** preview harness only: answer with these instead of calling the routes */
  demo?: { score: DraftScoreResult; options: string };
}) {
  const reduce = useReducedMotion();
  const stored = useSyncExternalStore(subscribe, readDraft, () => '');
  const [local, setLocal] = useState<string | null>(null);
  const text = local ?? stored;
  const [format, setFormat] = useState<Format>('x-post');
  const [side, setSide] = useState(true);
  const [sheet, setSheet] = useState(false);
  const [score, setScore] = useState<DraftScoreResult | null>(null);
  const [scoredText, setScoredText] = useState<string | null>(null);
  const [shown, setShown] = useState(0);
  const [scoring, setScoring] = useState(false);
  const [ask, setAsk] = useState('');
  const [history, setHistory] = useState<Msg[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [writing, setWriting] = useState(false);
  const [boardId, setBoardId] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);

  const setText = (v: string) => {
    setLocal(v);
    writeDraft(v);
  };
  const trimmed = text.trim();
  const stale = score !== null && scoredText !== trimmed;

  useEffect(() => {
    if (!note) return;
    const t = window.setTimeout(() => setNote(null), 3500);
    return () => window.clearTimeout(t);
  }, [note]);
  useEffect(() => () => abort.current?.abort(), []);

  const runScore = useCallback(async () => {
    if (scoring || trimmed.length < 12) return;
    setScoring(true);
    setError(null);
    try {
      if (demo) {
        await new Promise((r) => setTimeout(r, 400));
        setShown(0);
        setScore(demo.score);
        setScoredText(trimmed);
        window.setTimeout(() => setShown(demo.score.score), reduce ? 0 : 120);
        return;
      }
      const res = await fetch('/api/dashboard/draft-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          tzOffsetMin: -new Date().getTimezoneOffset(),
          ...(accountId ? { account: accountId } : {}),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as DraftScoreResult & { error?: string };
      if (!res.ok) throw new Error(json.error || 'Scoring failed. Try again.');
      setShown(0);
      setScore(json);
      setScoredText(trimmed);
      window.setTimeout(() => setShown(json.score), reduce ? 0 : 120);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scoring failed. Try again.');
    } finally {
      setScoring(false);
    }
  }, [accountId, demo, reduce, scoring, trimmed]);

  async function draftIt(request: string) {
    const content = request.trim();
    if (!content || writing) return;
    setError(null);
    setWriting(true);
    setOptions([]);
    if (demo) {
      setOptions(splitOptions(demo.options));
      setWriting(false);
      return;
    }
    const withDraft = trimmed
      ? `${content}\n\nMy draft so far:\n${trimmed.slice(0, 2000)}`
      : content;
    const next: Msg[] = [...history, { role: 'user', content: withDraft }];
    const ac = new AbortController();
    abort.current = ac;
    let out = '';
    try {
      const res = await fetch('/api/dashboard/copywriter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, messages: next }),
        signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || 'The copywriter is busy. Try again.');
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        out += dec.decode(value, { stream: true });
        setOptions(splitOptions(out));
      }
      if (!out.trim()) throw new Error('The draft came back empty. Try again.');
      setHistory([...next, { role: 'assistant' as const, content: out }].slice(-10));
      setAsk('');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally {
      setWriting(false);
      abort.current = null;
    }
  }

  async function saveToBoard(status: 'drafting' | 'posted') {
    if (!accountId || !trimmed) return;
    setError(null);
    if (demo)
      return setNote(status === 'posted' ? 'Marked posted.' : 'Saved to your board as a draft.');
    try {
      let id = boardId;
      if (!id) {
        const res = await fetch('/api/ideas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account: accountId, text: trimmed }),
        });
        const j = (await res.json().catch(() => ({}))) as { idea?: { id: string }; error?: string };
        if (!res.ok || !j.idea) throw new Error(j.error || "Couldn't save to the board.");
        id = j.idea.id;
        setBoardId(id);
      } else {
        await fetch('/api/ideas', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, text: trimmed }),
        });
      }
      const res = await fetch('/api/ideas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error("Couldn't update the board.");
      setNote(
        status === 'posted'
          ? 'Marked posted. It counts toward your body of work.'
          : 'Saved to your board as a draft.'
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save to the board.");
    }
  }

  // ⌘↵ score · ⌘. toggles the reading
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        void runScore();
      } else if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        setSide((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [runScore]);

  const over = format === 'x-post' && [...text].length > XLIMIT;
  const xIntent = `https://x.com/intent/post?text=${encodeURIComponent(trimmed.slice(0, 2000))}`;

  const reading = (
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
            Fit, hook, format and whether it sounds like you, before it goes out.
          </p>
          <Btn
            kind="primary"
            onClick={() => void runScore()}
            disabled={scoring || trimmed.length < 12}
            className="mt-4 w-full"
          >
            {scoring ? 'Reading…' : 'Score this draft'}
            <span className="hidden text-[10px] opacity-70 md:inline" style={{ fontFamily: VCR }}>
              ⌘↵
            </span>
          </Btn>
          {trimmed.length < 12 && (
            <p className="mt-2 text-[12px]" style={{ color: 'var(--v-muted)' }}>
              Write a line or two first.
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
              [
                'Format',
                `${score.format}${score.formatLift ? ` · ${score.formatLift.toFixed(1)}× your usual` : ''}`,
              ],
              ...(score.reach
                ? [['Likely reach', `${score.reach.low}–${score.reach.high}× your normal`]]
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
            <Btn kind="secondary" onClick={() => void runScore()} className="mt-4 w-full">
              {scoring ? 'Reading…' : 'Re-score the new version'}
            </Btn>
          )}
        </div>
      )}
      <div className="mt-6 border-t pt-4" style={{ borderColor: 'var(--v-rule)' }}>
        <label className="text-[13px]" style={{ color: 'var(--v-muted)' }} htmlFor="room-ask">
          Ask the copywriter
        </label>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void draftIt(ask || (idea ?? ''));
          }}
        >
          <input
            id="room-ask"
            value={ask}
            onChange={(e) => setAsk(e.target.value)}
            maxLength={600}
            placeholder={trimmed ? 'shorter · stronger hook · 3 options' : 'what should it say?'}
            className="v2-focus h-[44px] min-w-0 flex-1 px-3 text-[14px]"
            style={{
              border: 'none',
              padding: '0 12px',
              background: 'var(--v-raised)',
              color: 'var(--v-ink)',
              borderRadius: 12,
              boxShadow: 'inset 0 0 0 1px var(--v-rule)',
            }}
          />
          <Btn type="submit" kind="secondary" disabled={writing || !(ask.trim() || idea)}>
            {writing ? '…' : 'Ask'}
          </Btn>
        </form>
      </div>
    </div>
  );

  return (
    <div className="pb-28 md:pb-16">
      <div className="mx-auto flex max-w-[1180px] gap-10 px-4 md:px-8">
        <div className="mx-auto w-full max-w-[680px] flex-1 pt-4 md:pt-10">
          <Label tone="head-muted">Writing room{handle ? ` / @${handle}` : ''}</Label>
          <h1
            className="mt-3 text-[26px] leading-[1.12] md:text-[38px]"
            style={{
              fontFamily: DISPLAY,
              fontWeight: 500,
              letterSpacing: '-0.03em',
              color: 'var(--v-head)',
            }}
          >
            {idea ?? 'One idea. Write it the way you’d post it.'}
          </h1>

          <Panel className="v2-within mt-6 p-5 md:mt-8 md:p-8" style={{ borderRadius: 20 }}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              aria-label="Draft"
              rows={10}
              maxLength={4000}
              placeholder={
                idea
                  ? 'Start here, or ask the copywriter for a first draft.'
                  : 'Half-formed is fine.'
              }
              className="w-full resize-y text-[18px] leading-[1.65] outline-none md:text-[19px]"
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
              <div className="flex gap-1" role="radiogroup" aria-label="Format">
                {(
                  [
                    ['x-post', 'Post'],
                    ['thread', 'Thread'],
                  ] as const
                ).map(([id, name]) => (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={format === id}
                    onClick={() => setFormat(id)}
                    className="v2-focus min-h-[36px] px-3 text-[13px]"
                    style={{
                      borderRadius: 999,
                      color: format === id ? 'var(--v-ink)' : 'var(--v-muted)',
                      boxShadow: format === id ? 'inset 0 0 0 1px var(--v-ink)' : 'none',
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
              <span
                className="text-[12px]"
                style={{ fontFamily: VCR, color: over ? '#C2410C' : 'var(--v-muted)' }}
              >
                {format === 'x-post'
                  ? `${[...text].length} / ${XLIMIT}`
                  : `${trimmed ? trimmed.split(/\s+/).length : 0} WORDS`}
                {' / SAVED ON THIS DEVICE'}
              </span>
            </div>
          </Panel>

          {/* the copywriter's options, when asked */}
          <AnimatePresence>
            {options.length > 0 && (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0 }}
                className="mt-5 space-y-3"
              >
                <Label tone="head-muted">From the copywriter</Label>
                {options.map((o, k) => (
                  <Panel key={k} className="p-5">
                    <p className="whitespace-pre-wrap text-[16px] leading-[1.55]">{o}</p>
                    {!writing && (
                      <div className="mt-3 flex gap-2">
                        <Btn kind="secondary" onClick={() => setText(o)}>
                          Use this
                        </Btn>
                        <Btn
                          kind="quiet"
                          onClick={() => setText(trimmed ? `${trimmed}\n\n${o}` : o)}
                        >
                          Add below
                        </Btn>
                      </div>
                    )}
                  </Panel>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <p role="alert" className="mt-4 text-[14px]" style={{ color: 'var(--v-head)' }}>
              {error}
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-2">
            {!trimmed && idea ? (
              <Btn
                kind="cta"
                className="px-6"
                onClick={() => void draftIt(idea)}
                disabled={writing}
              >
                {writing ? 'Drafting…' : 'Draft it with the copywriter'}
              </Btn>
            ) : (
              <a
                href={trimmed ? xIntent : undefined}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!trimmed}
                className="v2-focus v2-press inline-flex min-h-[44px] items-center px-6 text-[15px] md:min-h-[40px]"
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 500,
                  borderRadius: 999,
                  background: 'var(--v-cta)',
                  color: 'var(--v-cta-ink)',
                  opacity: trimmed ? 1 : 0.4,
                  pointerEvents: trimmed ? 'auto' : 'none',
                }}
              >
                Open in X →
              </a>
            )}
            {accountId && trimmed && (
              <>
                <Btn
                  kind="quiet"
                  onClick={() => void saveToBoard('drafting')}
                  style={{ color: 'var(--v-head-muted)' }}
                >
                  Save to board
                </Btn>
                <Btn
                  kind="quiet"
                  onClick={() => void saveToBoard('posted')}
                  style={{ color: 'var(--v-head-muted)' }}
                >
                  I posted it
                </Btn>
              </>
            )}
          </div>
          <p className="mt-3 text-[12px]" style={{ color: 'var(--v-head-muted)' }}>
            Nothing posts from here: Open in X hands the text to X&apos;s own composer.
          </p>
        </div>

        {/* desktop: the reading sits beside the words */}
        {side && (
          <aside
            className="sticky top-6 hidden h-fit w-[330px] shrink-0 p-6 md:mt-10 md:block"
            style={{
              background: 'var(--v-surface)',
              color: 'var(--v-ink)',
              borderRadius: 20,
              boxShadow: 'inset 0 0 0 1px var(--v-rule)',
            }}
          >
            {reading}
          </aside>
        )}
      </div>

      {/* phone: the reading peeks from the bottom */}
      <div className="md:hidden">
        <button
          type="button"
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
            {score ? (
              <>
                Fit <span style={{ color: 'var(--v-signal-text)' }}>{score.score}</span>
                <span style={{ color: 'var(--v-muted)' }}> · {score.voice}</span>
              </>
            ) : (
              'Score this draft · ask the copywriter'
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
                className="fixed inset-x-0 bottom-0 z-50 max-h-[85vh] overflow-auto p-5 pb-8"
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
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setSheet(false)}
                  className="v2-focus mx-auto mb-4 block h-[24px] w-[64px]"
                >
                  <span
                    className="mx-auto block h-1 w-10"
                    style={{ background: 'var(--v-rule)', borderRadius: 4 }}
                  />
                </button>
                {reading}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {note && (
          <motion.div
            role="status"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0 }}
            className="fixed inset-x-0 bottom-[84px] z-[60] mx-auto w-fit px-5 py-3 text-[14px] md:bottom-6"
            style={{ background: 'var(--v-ink)', color: 'var(--v-surface)', borderRadius: 999 }}
          >
            {note}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
