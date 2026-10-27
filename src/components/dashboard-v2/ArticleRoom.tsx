'use client';

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { motion, Reorder, useDragControls, useReducedMotion } from 'motion/react';
import { Typewriter } from 'motion-plus/react';
import type { DraftScoreResult } from '@/components/growth/DraftScore';
import {
  MAX_SECTIONS,
  articleClipboard,
  articleWords,
  moveSection,
  outlineAsIdea,
  outlineText,
  parseOutline,
  parseSections,
  parseTitleHook,
  readArticle,
  sectionId,
  type ArticleDraft,
  type ArticleSection,
  type RoomFormat,
} from '@/lib/article';
import { streamCopy } from './copyStream';
import { FormatSwitch, ReadingDock, useNote } from './room';
import { ScoreReading, useDraftScore } from './ScoreReading';
import { Btn, DISPLAY, Label, Panel, VCR } from './ui';

/**
 * Article mode in the writing room (dashboard v2, slice 5). Outline first:
 *   1. pick the idea (today's prompt, an idea on the board, a top post),
 *   2. BrandOS suggests a title, a hook and 3–5 sections from the member's
 *      record and voice (copywriter format "outline"); every part can be
 *      edited, reordered (drag handle or ↑/↓) or regenerated,
 *   3. write section by section (format "article"); Score runs on the open
 *      section (draft-score takes up to 2,000 characters),
 *   4. "Copy for X Articles": rich text + plain fallback on the clipboard.
 *      X has no publish API, so nothing posts from here.
 * The article autosaves on this device; "Save outline to board" puts it in the
 * record as an idea (/api/ideas). An Article is one depth format among several,
 * never pitched as a growth trick.
 *
 * Motion+: the title types in once when the outline lands (Typewriter);
 * reduced motion prints it.
 */

export interface ArticleDemo {
  outline: string;
  section: string;
  score?: DraftScoreResult;
}

const KEY = 'brandos:room-article';

const listeners = new Set<() => void>();
function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}
function readRaw(): string {
  try {
    return window.localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}
function writeRaw(v: string) {
  try {
    if (v) window.localStorage.setItem(KEY, v);
    else window.localStorage.removeItem(KEY);
  } catch {
    // storage blocked: the article lives in this tab only
  }
  listeners.forEach((l) => l());
}

const field: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  color: 'var(--v-ink)',
  padding: 0,
  borderRadius: 0,
  boxShadow: 'none',
  width: '100%',
};

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

export default function ArticleRoom({
  idea,
  accountId,
  handle,
  boardIdeas,
  topPosts,
  onFormat,
  demo,
}: {
  idea: string | null;
  accountId: string | null;
  handle: string | null;
  boardIdeas: { id: string; text: string }[];
  topPosts: { text: string; note: string }[];
  onFormat: (f: RoomFormat) => void;
  demo?: ArticleDemo;
}) {
  const reduce = useReducedMotion();
  const raw = useSyncExternalStore(subscribe, readRaw, () => '');
  const stored = useMemo(() => readArticle(raw), [raw]);
  const [local, setLocal] = useState<ArticleDraft | null>(null);
  const article = local ?? stored;
  const [pick, setPick] = useState<string | null>(idea);
  const [own, setOwn] = useState('');
  const [busy, setBusy] = useState<null | 'outline' | 'title' | string>(null);
  const [landed, setLanded] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [side, setSide] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [undo, setUndo] = useState<ArticleDraft | null>(null);
  const abort = useRef<AbortController | null>(null);
  const scoreState = useDraftScore({ accountId, demo: demo?.score });
  const { setNote, view: noteView } = useNote();

  useEffect(() => () => abort.current?.abort(), []);

  const save = (a: ArticleDraft | null) => {
    setLocal(a ?? { title: '', hook: '', sections: [] });
    writeRaw(a ? JSON.stringify(a) : '');
  };
  const update = (patch: Partial<ArticleDraft>) => article && save({ ...article, ...patch });
  const setSection = (id: string, patch: Partial<ArticleSection>) =>
    article &&
    save({
      ...article,
      sections: article.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });

  const hasOutline = !!article && article.sections.length > 0;
  const open = article?.sections.find((s) => s.id === openId) ?? null;
  const subject = (own.trim() || pick || '').trim();

  async function ask(format: 'outline' | 'article', content: string, onText?: (t: string) => void) {
    abort.current?.abort();
    const ac = new AbortController();
    abort.current = ac;
    try {
      return await streamCopy({
        format,
        messages: [{ role: 'user', content }],
        signal: ac.signal,
        onText,
      });
    } finally {
      if (abort.current === ac) abort.current = null;
    }
  }

  async function outlineIt() {
    if (!subject || busy) return;
    setError(null);
    setBusy('outline');
    try {
      const out = demo
        ? demo.outline
        : await ask('outline', `Outline an X Article about: ${clip(subject, 800)}`);
      const next = parseOutline(out);
      if (!next) throw new Error("The outline didn't come back in shape. Try again.");
      setUndo(article);
      save(next);
      setLanded(true);
      setOpenId(next.sections[0]?.id ?? null);
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function regenTitle() {
    if (!article || busy) return;
    setError(null);
    setBusy('title');
    try {
      const out = demo
        ? demo.outline
        : await ask(
            'outline',
            `Here is my article outline:\n${outlineText(article)}\n\nSuggest a new Title and Hook only, as "Title:" and "Hook:" lines. Keep the sections as they are.`
          );
      const th = parseTitleHook(out);
      if (!th.title) throw new Error('No new title came back. Try again.');
      update({ title: th.title, hook: th.hook || article.hook });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function regenSection(s: ArticleSection) {
    if (!article || busy) return;
    const n = article.sections.findIndex((x) => x.id === s.id) + 1;
    setError(null);
    setBusy(`regen-${s.id}`);
    try {
      const out = demo
        ? `${n}. ${s.heading}, said plainly | ${s.point}`
        : await ask(
            'outline',
            `Here is my article outline:\n${outlineText(article)}\n\nReplace section ${n} ("${s.heading}") with one better section. Reply with one line only: "${n}. Heading | what it shows".`
          );
      const [fresh] = parseSections(out, 1);
      if (!fresh) throw new Error('No new section came back. Try again.');
      setSection(s.id, { heading: fresh.heading, point: fresh.point });
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function draftSection(s: ArticleSection) {
    if (!article || busy) return;
    const n = article.sections.findIndex((x) => x.id === s.id) + 1;
    setError(null);
    setBusy(`draft-${s.id}`);
    const before = s.body;
    try {
      if (demo) {
        setSection(s.id, { body: demo.section });
      } else {
        const content = [
          outlineText(article),
          '',
          `Write section ${n}: "${s.heading}"${s.point ? ` (${s.point})` : ''}.`,
          before.trim() ? `\nMy draft of this section so far:\n${clip(before.trim(), 1500)}` : '',
        ].join('\n');
        // stream straight into the section (the latest article from storage stays the base)
        let latest = article;
        await ask('article', content, (t) => {
          latest = {
            ...latest,
            sections: latest.sections.map((x) => (x.id === s.id ? { ...x, body: t.trim() } : x)),
          };
          save(latest);
        });
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setError((e as Error).message);
        setSection(s.id, { body: before });
      }
    } finally {
      setBusy(null);
    }
  }

  async function copyOut() {
    if (!article) return;
    const { html, text } = articleClipboard(article);
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' }),
          }),
        ]);
      } else {
        await navigator.clipboard.writeText(text);
      }
      setNote("Copied. Paste it into X's Article editor (nothing was posted).");
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setNote('Copied as plain text. Paste it into X’s Article editor.');
      } catch {
        setError("Couldn't reach the clipboard. Select the text and copy it instead.");
      }
    }
  }

  async function saveOutline() {
    if (!article || !accountId) return;
    setError(null);
    if (demo) return setNote('Outline saved to your board.');
    try {
      const res = await fetch('/api/ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account: accountId, text: outlineAsIdea(article) }),
      });
      const j = (await res.json().catch(() => ({}))) as { idea?: { id: string }; error?: string };
      if (!res.ok || !j.idea) throw new Error(j.error || "Couldn't save to the board.");
      await fetch('/api/ideas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: j.idea.id, status: 'drafting' }),
      });
      setNote('Outline saved to your board.');
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save to the board.");
    }
  }

  // ⌘↵ scores the open section · ⌘. toggles the reading
  const run = scoreState.run;
  const openBody = open?.body ?? '';
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        void run(openBody);
      } else if ((e.metaKey || e.ctrlKey) && e.key === '.') {
        e.preventDefault();
        setSide((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run, openBody]);

  const choices: { key: string; label: string; text: string; tag: string }[] = [
    ...(idea ? [{ key: 'today', label: idea, text: idea, tag: "Today's idea" }] : []),
    ...boardIdeas.slice(0, 4).map((i) => ({
      key: `idea-${i.id}`,
      label: i.text,
      text: i.text,
      tag: 'On your board',
    })),
    ...topPosts.slice(0, 3).map((p, k) => ({
      key: `post-${k}`,
      label: `Go deeper on “${clip(p.text, 90)}”`,
      text: `Go deeper on my post “${clip(p.text, 240)}”`,
      tag: p.note,
    })),
  ];

  const words = article ? articleWords(article) : 0;

  return (
    <div className="pb-28 md:pb-16">
      <div className="mx-auto flex max-w-[1180px] gap-10 px-4 md:px-8">
        <div className="mx-auto w-full max-w-[680px] flex-1 pt-4 md:pt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Label tone="head-muted">Writing room / Article{handle ? ` / @${handle}` : ''}</Label>
            <FormatSwitchOnCanvas value="article" onChange={onFormat} />
          </div>

          {!hasOutline ? (
            // 1. pick the idea
            <div className="mt-4">
              <h1
                className="text-[28px] leading-[1.1] md:text-[40px]"
                style={{
                  fontFamily: DISPLAY,
                  fontWeight: 500,
                  letterSpacing: '-0.03em',
                  color: 'var(--v-head)',
                }}
              >
                What&apos;s the article about?
              </h1>
              <p className="mt-2 text-[15px]" style={{ color: 'var(--v-head-muted)' }}>
                Pick one. BrandOS outlines it from your record and your voice; you shape it from
                there.
              </p>
              <div className="mt-6 space-y-2" role="radiogroup" aria-label="Article idea">
                {choices.map((c) => {
                  const on = !own.trim() && pick === c.text;
                  return (
                    <button
                      key={c.key}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => {
                        setPick(c.text);
                        setOwn('');
                      }}
                      className="v2-focus block min-h-[56px] w-full p-4 text-left"
                      style={{
                        background: 'var(--v-surface)',
                        color: 'var(--v-ink)',
                        borderRadius: 16,
                        boxShadow: on
                          ? 'inset 0 0 0 2px var(--v-signal)'
                          : 'inset 0 0 0 1px var(--v-rule)',
                      }}
                    >
                      <span className="block text-[16px] leading-[1.4]">{clip(c.label, 160)}</span>
                      <span className="mt-1 block text-[12px]" style={{ color: 'var(--v-muted)' }}>
                        {c.tag}
                      </span>
                    </button>
                  );
                })}
                <Panel className="v2-within p-4" style={{ borderRadius: 16 }}>
                  <label
                    htmlFor="article-own"
                    className="text-[12px]"
                    style={{ color: 'var(--v-muted)' }}
                  >
                    Or your own
                  </label>
                  <input
                    id="article-own"
                    value={own}
                    onChange={(e) => setOwn(e.target.value)}
                    maxLength={600}
                    placeholder="what you know that your audience doesn’t"
                    className="mt-1 h-[36px] text-[16px] outline-none v2-field"
                    style={{ ...field, fontSize: 16 }}
                  />
                </Panel>
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <Btn
                  kind="cta"
                  className="px-6"
                  onClick={() => void outlineIt()}
                  disabled={!subject || !!busy}
                >
                  {busy === 'outline' ? 'Outlining…' : 'Outline it'}
                </Btn>
                {undo && (
                  <Btn
                    kind="quiet"
                    onClick={() => {
                      save(undo);
                      setUndo(null);
                    }}
                    style={{ color: 'var(--v-head-muted)' }}
                  >
                    Undo start over
                  </Btn>
                )}
              </div>
            </div>
          ) : (
            article && (
              <>
                {/* 2. the outline: edit, reorder, regenerate */}
                <Panel className="mt-5 p-5 md:p-8" style={{ borderRadius: 20 }}>
                  <div className="flex items-center justify-between gap-3">
                    <Label>Outline</Label>
                    <Btn
                      kind="quiet"
                      onClick={() => void regenTitle()}
                      disabled={!!busy}
                      className="!min-h-[36px] px-3 text-[13px]"
                    >
                      {busy === 'title' ? 'Thinking…' : '↻ New title + hook'}
                    </Btn>
                  </div>
                  {landed && !reduce ? (
                    <h2
                      className="mt-3 text-[26px] leading-[1.15] md:text-[34px]"
                      style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: '-0.03em' }}
                    >
                      <Typewriter
                        speed={28}
                        cursorBlinkRepeat={1}
                        onComplete={() => setLanded(false)}
                      >
                        {article.title}
                      </Typewriter>
                    </h2>
                  ) : (
                    <textarea
                      value={article.title}
                      onChange={(e) =>
                        update({ title: e.target.value.replace(/\n/g, ' ').slice(0, 120) })
                      }
                      rows={2}
                      aria-label="Title"
                      className="mt-3 resize-none text-[26px] leading-[1.15] outline-none v2-field md:text-[34px]"
                      style={{
                        ...field,
                        // inline: the global input rule (14px) beats layered utilities
                        fontSize: 'clamp(26px, 2.6vw, 34px)',
                        lineHeight: 1.15,
                        fontFamily: DISPLAY,
                        fontWeight: 500,
                        letterSpacing: '-0.03em',
                      }}
                    />
                  )}
                  <textarea
                    value={article.hook}
                    onChange={(e) => update({ hook: e.target.value.slice(0, 400) })}
                    aria-label="Hook"
                    rows={2}
                    className="mt-3 resize-none text-[17px] leading-[1.5] outline-none v2-field"
                    style={{ ...field, color: 'var(--v-muted)', fontSize: 17, lineHeight: 1.5 }}
                  />
                  <Reorder.Group
                    axis="y"
                    values={article.sections}
                    onReorder={(sections) => update({ sections })}
                    className="mt-5 space-y-2"
                    aria-label="Sections"
                  >
                    {article.sections.map((s, i) => (
                      <OutlineRow
                        key={s.id}
                        s={s}
                        n={i + 1}
                        count={article.sections.length}
                        delay={landed && !reduce ? 0.15 + i * 0.06 : 0}
                        busy={busy === `regen-${s.id}`}
                        disabled={!!busy}
                        onChange={(patch) => setSection(s.id, patch)}
                        onMove={(dir) =>
                          update({ sections: moveSection(article.sections, s.id, dir) })
                        }
                        onRegen={() => void regenSection(s)}
                        onRemove={() => {
                          setUndo(article);
                          update({ sections: article.sections.filter((x) => x.id !== s.id) });
                          setNote('Section removed.');
                        }}
                      />
                    ))}
                  </Reorder.Group>
                  {article.sections.length < MAX_SECTIONS && (
                    <Btn
                      kind="quiet"
                      className="mt-3 !min-h-[36px] px-3 text-[13px]"
                      onClick={() => {
                        const s = { id: sectionId(), heading: 'New section', point: '', body: '' };
                        update({ sections: [...article.sections, s] });
                        setOpenId(s.id);
                      }}
                    >
                      + Add a section
                    </Btn>
                  )}
                </Panel>

                {/* 3. section by section, one open at a time */}
                <div className="mt-6">
                  <div className="flex items-baseline justify-between">
                    <Label tone="head-muted">Write it</Label>
                    <span
                      className="text-[12px]"
                      style={{ fontFamily: VCR, color: 'var(--v-head-muted)' }}
                    >
                      {words} WORDS / SAVED ON THIS DEVICE
                    </span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {article.sections.map((s, i) => {
                      const isOpen = s.id === openId;
                      const w = s.body.trim() ? s.body.trim().split(/\s+/).length : 0;
                      return (
                        <Panel
                          key={s.id}
                          className={isOpen ? 'v2-within' : ''}
                          style={{ borderRadius: 16 }}
                        >
                          <button
                            type="button"
                            onClick={() => setOpenId(isOpen ? null : s.id)}
                            aria-expanded={isOpen}
                            className="v2-focus flex min-h-[56px] w-full items-center justify-between gap-3 px-5 text-left"
                          >
                            <span className="flex items-baseline gap-3">
                              <span
                                className="text-[11px]"
                                style={{ fontFamily: VCR, color: 'var(--v-muted)' }}
                              >
                                0{i + 1}
                              </span>
                              <span className="text-[16px]">{s.heading}</span>
                            </span>
                            <span
                              className="shrink-0 text-[12px]"
                              style={{ color: 'var(--v-muted)' }}
                            >
                              {w ? `${w} words` : 'Not written'} {isOpen ? '▴' : '▾'}
                            </span>
                          </button>
                          {isOpen && (
                            <div className="px-5 pb-5">
                              {s.point && (
                                <p className="text-[14px]" style={{ color: 'var(--v-muted)' }}>
                                  {s.point}
                                </p>
                              )}
                              <textarea
                                value={s.body}
                                onChange={(e) =>
                                  setSection(s.id, { body: e.target.value.slice(0, 6000) })
                                }
                                aria-label={`Section ${i + 1}: ${s.heading}`}
                                rows={8}
                                placeholder="Write it, or let the copywriter take a first pass."
                                className="mt-3 resize-y text-[17px] leading-[1.65] outline-none v2-field"
                                style={{
                                  ...field,
                                  fontFamily: DISPLAY,
                                  fontSize: 17,
                                  lineHeight: 1.65,
                                }}
                              />
                              <div className="mt-3 flex flex-wrap gap-2">
                                <Btn
                                  kind="secondary"
                                  onClick={() => void draftSection(s)}
                                  disabled={!!busy}
                                >
                                  {busy === `draft-${s.id}`
                                    ? 'Drafting…'
                                    : s.body.trim()
                                      ? 'Redraft this section'
                                      : 'Draft this section'}
                                </Btn>
                              </div>
                            </div>
                          )}
                        </Panel>
                      );
                    })}
                  </div>
                </div>

                {/* 4. copy out */}
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <Btn kind="cta" className="px-6" onClick={() => void copyOut()}>
                    Copy for X Articles
                  </Btn>
                  {accountId && (
                    <Btn
                      kind="quiet"
                      onClick={() => void saveOutline()}
                      style={{ color: 'var(--v-head-muted)' }}
                    >
                      Save outline to board
                    </Btn>
                  )}
                  <Btn
                    kind="quiet"
                    onClick={() => {
                      setUndo(article);
                      save(null);
                      setOpenId(null);
                    }}
                    style={{ color: 'var(--v-head-muted)' }}
                  >
                    Start over
                  </Btn>
                  {undo && (
                    <Btn
                      kind="quiet"
                      onClick={() => {
                        save(undo);
                        setUndo(null);
                      }}
                      style={{ color: 'var(--v-head-muted)' }}
                    >
                      Undo
                    </Btn>
                  )}
                </div>
                <p className="mt-3 text-[12px]" style={{ color: 'var(--v-head-muted)' }}>
                  X has no way to publish from outside. Copy, then paste into X&apos;s Article
                  editor: the title, headings and paragraphs come with it.
                </p>
              </>
            )
          )}

          {error && (
            <p role="alert" className="mt-4 text-[14px]" style={{ color: 'var(--v-head)' }}>
              {error}
            </p>
          )}
        </div>

        <ReadingDock
          side={side}
          phone={hasOutline}
          peek={
            open
              ? scoreState.score
                ? `Fit ${scoreState.score.score} · ${clip(open.heading, 24)}`
                : `Score “${clip(open.heading, 28)}”`
              : 'Open a section to score it'
          }
        >
          {open ? (
            <>
              <p className="mb-4 text-[13px]" style={{ color: 'var(--v-muted)' }}>
                Reading the open section:{' '}
                <span style={{ color: 'var(--v-ink)' }}>{open.heading}</span>
              </p>
              <ScoreReading state={scoreState} text={open.body} what="section" />
            </>
          ) : (
            <div>
              <Label>BrandOS reads</Label>
              <p className="mt-4 text-[15px] leading-[1.5]" style={{ color: 'var(--v-muted)' }}>
                {hasOutline
                  ? 'Open a section to score it as you write.'
                  : 'The outline comes from your read, your pillars and the posts that already work for you.'}
              </p>
            </div>
          )}
        </ReadingDock>
      </div>
      {noteView}
    </div>
  );
}

/** The format switch on the page canvas (the room's top line in Article mode). */
function FormatSwitchOnCanvas(props: { value: RoomFormat; onChange: (f: RoomFormat) => void }) {
  return (
    <div
      className="p-1"
      style={{
        background: 'var(--v-surface)',
        borderRadius: 999,
        boxShadow: 'inset 0 0 0 1px var(--v-rule)',
      }}
    >
      <FormatSwitch {...props} />
    </div>
  );
}

function OutlineRow({
  s,
  n,
  count,
  delay,
  busy,
  disabled,
  onChange,
  onMove,
  onRegen,
  onRemove,
}: {
  s: ArticleSection;
  n: number;
  count: number;
  delay: number;
  busy: boolean;
  disabled: boolean;
  onChange: (patch: Partial<ArticleSection>) => void;
  onMove: (dir: -1 | 1) => void;
  onRegen: () => void;
  onRemove: () => void;
}) {
  const controls = useDragControls();
  const small =
    'v2-focus inline-flex h-[36px] min-w-[36px] items-center justify-center text-[14px]';
  return (
    <Reorder.Item
      value={s}
      dragListener={false}
      dragControls={controls}
      className="flex items-start gap-2 p-3"
      style={{
        background: 'var(--v-raised)',
        borderRadius: 14,
        boxShadow: 'inset 0 0 0 1px var(--v-rule)',
      }}
    >
      <motion.div
        className="flex w-full flex-wrap items-start gap-x-2 md:flex-nowrap"
        initial={delay ? { opacity: 0, y: 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, delay, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <button
          type="button"
          aria-label={`Drag to reorder section ${n}`}
          onPointerDown={(e) => controls.start(e)}
          className="v2-focus flex h-[44px] w-[28px] shrink-0 cursor-grab touch-none items-center justify-center"
          style={{ color: 'var(--v-muted)' }}
        >
          ⋮⋮
        </button>
        <span
          className="mt-[12px] w-[22px] shrink-0 text-[11px]"
          style={{ fontFamily: VCR, color: 'var(--v-muted)' }}
        >
          0{n}
        </span>
        <div className="min-w-0 flex-1 basis-[180px]">
          <input
            value={s.heading}
            onChange={(e) => onChange({ heading: e.target.value.slice(0, 90) })}
            aria-label={`Section ${n} heading`}
            className="mt-[6px] h-[32px] text-[16px] outline-none v2-field"
            style={{ ...field, fontWeight: 500, fontSize: 16 }}
          />
          <input
            value={s.point}
            onChange={(e) => onChange({ point: e.target.value.slice(0, 240) })}
            aria-label={`Section ${n}: what it shows`}
            placeholder="what this section shows"
            className="h-[28px] text-[14px] outline-none v2-field"
            style={{ ...field, color: 'var(--v-muted)', fontSize: 14 }}
          />
        </div>
        <div
          // phones: the row actions sit on their own line under the fields
          className="flex shrink-0 justify-end gap-0.5 max-md:w-full"
          style={{ color: 'var(--v-muted)' }}
        >
          <button
            type="button"
            className={small}
            aria-label={`Move section ${n} up`}
            disabled={n === 1}
            onClick={() => onMove(-1)}
            style={{ opacity: n === 1 ? 0.3 : 1 }}
          >
            ↑
          </button>
          <button
            type="button"
            className={small}
            aria-label={`Move section ${n} down`}
            disabled={n === count}
            onClick={() => onMove(1)}
            style={{ opacity: n === count ? 0.3 : 1 }}
          >
            ↓
          </button>
          <button
            type="button"
            className={small}
            aria-label={`Regenerate section ${n}`}
            disabled={disabled}
            onClick={onRegen}
          >
            {busy ? '…' : '↻'}
          </button>
          <button
            type="button"
            className={small}
            aria-label={`Remove section ${n}`}
            disabled={count <= 1}
            onClick={onRemove}
            style={{ opacity: count <= 1 ? 0.3 : 1 }}
          >
            ×
          </button>
        </div>
      </motion.div>
    </Reorder.Item>
  );
}
