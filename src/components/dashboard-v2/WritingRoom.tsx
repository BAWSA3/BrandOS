'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import type { DraftScoreResult } from '@/components/growth/DraftScore';
import type { RoomFormat } from '@/lib/article';
import ArticleRoom, { type ArticleDemo } from './ArticleRoom';
import { streamCopy, type CopyMsg } from './copyStream';
import { ScoreReading, useDraftScore } from './ScoreReading';
import { FormatSwitch, ReadingDock, useNote } from './room';
import { Btn, DISPLAY, Label, Panel, VCR } from './ui';
import LiveComposerView from '@/components/live-composer/LiveComposerView';
import { useLiveComposer } from '@/components/live-composer/useLiveComposer';
import { trackBetaEvent } from '@/lib/analytics';

/**
 * The writing room (dashboard v2): one idea at a time, distraction-free, with
 * BrandOS reading beside it. Three formats in one room: Post, Thread and
 * Article (slice 5: outline first, then section by section; ArticleRoom).
 * Same routes as before:
 *   /api/dashboard/copywriter  (streamed; formats x-post, thread, outline, article)
 *   /api/dashboard/draft-score (fit, voice, hook, format, reach band, fixes)
 *   /api/ideas                 (save to the board, mark drafting / posted)
 * Drafts autosave on this device; "Save to board" puts them in the record.
 *
 * Keys: ⌘↵ score · ⌘. hide the reading. Motion+ headline: the fit score rolls.
 */

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
  initialFormat = 'x-post',
  boardIdeas = [],
  topPosts = [],
  brands = [],
  live = false,
  demo,
}: {
  /** the move or idea this room opened on (from ?prompt=), or null */
  idea: string | null;
  /** the member's own brand (tracked account), for scoring and the board */
  accountId: string | null;
  handle: string | null;
  /** ?mode=article opens in Article mode */
  initialFormat?: RoomFormat;
  /** Article mode's idea picker: open ideas on the board, top posts from the record */
  boardIdeas?: { id: string; text: string }[];
  topPosts?: { text: string; note: string }[];
  /** the workspace's own brands: an SMM switches which brand the draft is read against */
  brands?: { id: string; handle: string }[];
  /** live composer (LIVE_COMPOSER): marks while typing instead of paste-and-check */
  live?: boolean;
  /** preview harness only: answer with these instead of calling the routes */
  demo?: { score: DraftScoreResult; options: string } & Partial<ArticleDemo>;
}) {
  const [format, setFormat] = useState<RoomFormat>(initialFormat);
  if (format === 'article') {
    return (
      <ArticleRoom
        idea={idea}
        accountId={accountId}
        handle={handle}
        boardIdeas={boardIdeas}
        topPosts={topPosts}
        onFormat={setFormat}
        demo={
          demo?.outline && demo.section
            ? { ...demo, outline: demo.outline, section: demo.section }
            : undefined
        }
      />
    );
  }
  return (
    <PostRoom
      idea={idea}
      accountId={accountId}
      handle={handle}
      format={format}
      onFormat={setFormat}
      demo={demo}
      live={live && !demo}
      brands={brands}
      ideas={boardIdeas}
    />
  );
}

function PostRoom({
  idea,
  accountId: ownAccountId,
  handle,
  format,
  onFormat,
  demo,
  live = false,
  brands = [],
  ideas = [],
}: {
  idea: string | null;
  accountId: string | null;
  handle: string | null;
  format: 'x-post' | 'thread';
  onFormat: (f: RoomFormat) => void;
  demo?: { score: DraftScoreResult; options: string };
  live?: boolean;
  brands?: { id: string; handle: string }[];
  ideas?: { id: string; text: string }[];
}) {
  // the brand the draft is read against (SMMs switch; marks follow it)
  const [accountId, setAccountId] = useState<string | null>(ownAccountId);
  const reduce = useReducedMotion();
  const stored = useSyncExternalStore(subscribe, readDraft, () => '');
  const [local, setLocal] = useState<string | null>(null);
  const text = local ?? stored;
  const [side, setSide] = useState(!live);
  const [ask, setAsk] = useState('');
  const [history, setHistory] = useState<CopyMsg[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [writing, setWriting] = useState(false);
  const [boardId, setBoardId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abort = useRef<AbortController | null>(null);
  const scoreState = useDraftScore({ accountId, demo: demo?.score });
  const liveState = useLiveComposer({
    text: live ? text : '',
    enabled: live,
    accountId,
    ideas: accountId === ownAccountId ? ideas : [],
  });
  const { setNote, view: noteView } = useNote();

  const setText = (v: string) => {
    setLocal(v);
    writeDraft(v);
  };
  const trimmed = text.trim();

  useEffect(() => () => abort.current?.abort(), []);

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
    const next: CopyMsg[] = [...history, { role: 'user', content: withDraft }];
    const ac = new AbortController();
    abort.current = ac;
    try {
      const out = await streamCopy({
        format,
        messages: next,
        signal: ac.signal,
        onText: (t) => setOptions(splitOptions(t)),
      });
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
  const run = scoreState.run;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        void run(trimmed);
      } else if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        setSide((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run, trimmed]);

  const over = format === 'x-post' && [...text].length > XLIMIT;
  const xIntent = `https://x.com/intent/post?text=${encodeURIComponent(trimmed.slice(0, 2000))}`;
  const score = scoreState.score;

  return (
    <div className="pb-28 md:pb-16">
      <div className="mx-auto flex max-w-[1180px] gap-10 px-4 md:px-8">
        <div
          className={`mx-auto w-full flex-1 pt-4 md:pt-10 ${live ? 'max-w-[1080px]' : 'max-w-[680px]'}`}
        >
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

          {live ? (
            <div className="mt-6 md:mt-8">
              <LiveComposerView
                state={liveState}
                onChange={setText}
                placeholder={
                  idea ? 'Start here. BrandOS reads as you write.' : 'Half-formed is fine.'
                }
                ideaHref={() => '/dashboard?view=brand#ideas'}
                header={
                  brands.length > 1 ? (
                    <label className="inline-flex items-center gap-2">
                      <Label tone="head-muted">Reading as</Label>
                      <select
                        value={accountId ?? ''}
                        onChange={(e) => setAccountId(e.target.value || null)}
                        className="v2-focus bg-transparent text-[13px]"
                        style={{ fontFamily: VCR, color: 'var(--v-ink)' }}
                      >
                        {brands.map((b) => (
                          <option key={b.id} value={b.id}>
                            @{b.handle}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : null
                }
                footer={
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <FormatSwitch value={format} onChange={onFormat} />
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
                }
              />
            </div>
          ) : (
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
                <FormatSwitch value={format} onChange={onFormat} />
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
          )}

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
                onClick={() => {
                  // copy out: the clipboard too (threads, long posts), and count it
                  navigator.clipboard?.writeText(trimmed).catch(() => {});
                  trackBetaEvent('beta_composer_copied_out', {
                    live,
                    format,
                    chars: [...trimmed].length,
                    marks: live ? liveState.marks.length : 0,
                    score: live ? (liveState.score ?? -1) : -1,
                  });
                }}
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

        <ReadingDock
          side={side}
          peek={
            score ? (
              <>
                Fit <span style={{ color: 'var(--v-signal-text)' }}>{score.score}</span>
                <span style={{ color: 'var(--v-muted)' }}> · {score.voice}</span>
              </>
            ) : (
              'Score this draft · ask the copywriter'
            )
          }
        >
          <ScoreReading state={scoreState} text={text} />
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
                placeholder={
                  trimmed ? 'shorter · stronger hook · 3 options' : 'what should it say?'
                }
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
        </ReadingDock>
      </div>
      {noteView}
    </div>
  );
}
