'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';
import { useV2 } from './context';
import { PILLARS, PLAYBOOK, RECORD, WEEKS, WORKING, type Section } from './sample';
import { Btn, DISPLAY, Label, MockNote, Panel, VCR } from './ui';

/**
 * The Playbook: home. A living page for the brand, pre-filled from the read
 * (endowed progress) and edited in place (the IKEA effect: an edited section
 * is stamped "Yours"). Everything feeds in; the workspaces open from here.
 *
 * Motion+ headline: the score rolls up in the Klein Record tile.
 */

const owned = (secs: Section[], pillars: typeof PILLARS) =>
  Math.round(
    (([...secs.map((s) => s.owner), ...pillars.map((p) => p.owner)].filter((o) => o === 'yours')
      .length +
      2) /
      (secs.length + pillars.length + 2)) *
      100
  );

function OwnerMark({ owner, edited }: { owner: 'read' | 'yours'; edited?: string }) {
  const reduce = useReducedMotion();
  return owner === 'yours' ? (
    <motion.span
      key="yours"
      initial={reduce ? false : { scale: 1.12, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.42, ease: 'easeOut' }}
      className="inline-flex items-center gap-1.5 px-2 py-1 text-[10px] uppercase tracking-[0.14em]"
      style={{
        fontFamily: VCR,
        borderRadius: 999,
        background: 'var(--v-signal)',
        color: 'var(--v-on-signal)',
      }}
    >
      Yours{edited ? ` / ${edited}` : ''}
    </motion.span>
  ) : (
    <span
      className="inline-flex items-center px-2 py-1 text-[10px] uppercase tracking-[0.14em]"
      style={{
        fontFamily: VCR,
        borderRadius: 999,
        boxShadow: 'inset 0 0 0 1px var(--v-rule)',
        color: 'var(--v-muted)',
      }}
    >
      From your read
    </span>
  );
}

function EditableSection({ s, onSave }: { s: Section; onSave: (body: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(s.body);
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (editing && el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
  }, [editing]);
  return (
    <Panel className="p-6 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <Label>{s.label}</Label>
        <OwnerMark owner={s.owner} edited={s.edited} />
      </div>
      {editing ? (
        <textarea
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            setEditing(false);
            if (draft.trim() !== s.body) onSave(draft.trim());
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setDraft(s.body);
              setEditing(false);
            }
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) (e.target as HTMLElement).blur();
          }}
          rows={3}
          aria-label={`Edit ${s.label}`}
          className="mt-4 w-full resize-none bg-transparent text-[22px] leading-[1.35] outline-none md:text-[26px]"
          style={{
            fontFamily: DISPLAY,
            letterSpacing: '-0.02em',
            color: 'var(--v-ink)',
            background: 'transparent',
            border: 'none',
            borderRadius: 0,
            padding: 0,
            boxShadow: 'none',
            borderBottom: '1px solid var(--v-signal)',
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="v2-focus group mt-4 block w-full text-left"
          aria-label={`${s.label}: ${s.body}. Edit`}
        >
          <span
            className="text-[22px] leading-[1.35] md:text-[26px]"
            style={{ fontFamily: DISPLAY, letterSpacing: '-0.02em' }}
          >
            {s.body}
          </span>
          <span
            className="mt-3 block text-[13px] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            style={{ color: 'var(--v-muted)' }}
          >
            Click to make it yours · saves on its own
          </span>
        </button>
      )}
    </Panel>
  );
}

/** Body of work: ideas → drafts → posts per week, with the score line on top. */
function BodyOfWork() {
  const max = Math.max(...WEEKS.map((w) => w.ideas + w.drafts + w.posts));
  const total = WEEKS.reduce(
    (a, w) => ({ ideas: a.ideas + w.ideas, drafts: a.drafts + w.drafts, posts: a.posts + w.posts }),
    { ideas: 0, drafts: 0, posts: 0 }
  );
  const H = 140;
  const minS = 60;
  const maxS = 76;
  return (
    <Panel className="p-6 md:col-span-2 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label>Body of work / 8 weeks</Label>
        <span className="text-[13px]" style={{ color: 'var(--v-muted)' }}>
          {total.ideas} ideas → {total.drafts} drafts → {total.posts} posts · score 64 → 72
        </span>
      </div>
      <div className="relative mt-6" style={{ height: H + 24 }}>
        <div className="flex h-[140px] items-end gap-2 md:gap-4">
          {WEEKS.map((w, i) => {
            const k = (n: number) => `${(n / max) * 100}%`;
            const last = i === WEEKS.length - 1;
            return (
              <div key={w.w} className="flex h-full flex-1 flex-col justify-end">
                <div
                  style={{
                    height: k(w.ideas),
                    background: 'var(--v-track)',
                    borderRadius: '6px 6px 0 0',
                  }}
                />
                <div style={{ height: k(w.drafts), background: 'var(--v-muted)', opacity: 0.45 }} />
                <div
                  style={{
                    height: k(w.posts),
                    background: last ? 'var(--v-signal)' : 'var(--v-ink)',
                    opacity: last ? 1 : 0.85,
                  }}
                />
              </div>
            );
          })}
        </div>
        <svg
          className="pointer-events-none absolute inset-x-0 top-0"
          viewBox={`0 0 ${WEEKS.length * 10} ${H}`}
          preserveAspectRatio="none"
          style={{ height: H, width: '100%' }}
          aria-hidden
        >
          <polyline
            fill="none"
            stroke="var(--v-signal-text)"
            strokeWidth={1.5}
            vectorEffect="non-scaling-stroke"
            strokeDasharray="3 3"
            points={WEEKS.map(
              (w, i) => `${i * 10 + 5},${H - ((w.score - minS) / (maxS - minS)) * H}`
            ).join(' ')}
          />
        </svg>
        <div
          className="mt-2 flex justify-between text-[10px]"
          style={{ fontFamily: VCR, color: 'var(--v-muted)' }}
        >
          <span>{WEEKS[0].w.toUpperCase()}</span>
          <span>THIS WEEK</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-[12px]" style={{ color: 'var(--v-muted)' }}>
        <span>▮ posts</span>
        <span style={{ opacity: 0.8 }}>▮ drafts</span>
        <span style={{ opacity: 0.6 }}>▮ ideas</span>
        <span style={{ color: 'var(--v-signal-text)' }}>- - score</span>
      </div>
    </Panel>
  );
}

export default function Playbook() {
  const { go, toast } = useV2();
  const reduce = useReducedMotion();
  const [secs, setSecs] = useState(PLAYBOOK);
  const [score, setScore] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setScore(RECORD.score), reduce ? 0 : 300);
    return () => window.clearTimeout(t);
  }, [reduce]);
  const pct = owned(secs, PILLARS);

  const save = (id: string, body: string) => {
    const before = secs;
    setSecs((all) =>
      all.map((s) => (s.id === id ? { ...s, body, owner: 'yours', edited: '27 Oct' } : s))
    );
    toast('Saved. That section is yours now.', () => setSecs(before));
  };

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pb-10 pt-6 md:px-10 md:pt-14">
      {/* Document head */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label tone="head-muted">Playbook / Entry No. {RECORD.entry}</Label>
        <Label tone="head-muted">Updated 27 Oct 2026</Label>
      </div>
      <h1
        className="mt-4 text-[48px] leading-[0.95] md:text-[96px]"
        style={{
          fontFamily: DISPLAY,
          fontWeight: 500,
          letterSpacing: '-0.05em',
          color: 'var(--v-head)',
        }}
      >
        @{RECORD.handle}
      </h1>
      <div className="mt-3 text-[15px]" style={{ color: 'var(--v-head-muted)' }}>
        <span style={{ fontFamily: VCR, letterSpacing: '0.12em' }}>{RECORD.classification}</span>
        {'  ·  '}Since you joined: +{RECORD.since.followers} followers, reach up{' '}
        {RECORD.since.reach}%
      </div>

      {/* Endowed progress */}
      <div className="mt-8 max-w-[560px]">
        <div
          className="flex items-baseline justify-between text-[14px]"
          style={{ color: 'var(--v-head)' }}
        >
          <span>Started from your read. {pct}% is now yours.</span>
        </div>
        <div
          className="mt-2 h-[6px] overflow-hidden"
          style={{ background: 'var(--v-dot)', borderRadius: 99 }}
        >
          <motion.div
            className="h-full"
            animate={{ width: `${pct}%` }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 22 }}
            style={{ background: 'var(--v-head)', borderRadius: 99 }}
          />
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        <EditableSection s={secs[0]} onSave={(b) => save(secs[0].id, b)} />

        {/* The Record: the one Klein tile */}
        <section
          className="p-6 md:row-span-2 md:p-8"
          style={{
            background: 'var(--v-signal)',
            color: 'var(--v-on-signal)',
            borderRadius: 18,
            boxShadow: 'inset 0 0 0 1px var(--v-signal-edge)',
          }}
        >
          <div className="flex items-center justify-between">
            <Label tone="on-signal" style={{ opacity: 0.85 }}>
              The Record
            </Label>
            <Label tone="on-signal" style={{ opacity: 0.85 }}>
              Read 23 Oct
            </Label>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <AnimateNumber
              className="text-[96px] leading-none md:text-[120px]"
              style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: '-0.05em' }}
              transition={reduce ? { duration: 0 } : { type: 'spring', duration: 1.3, bounce: 0 }}
            >
              {score}
            </AnimateNumber>
            <span className="text-[13px] opacity-80" style={{ fontFamily: VCR }}>
              /100
            </span>
          </div>
          <div className="mt-2 text-[14px] opacity-90">▲ 2 since 14 Oct</div>
          <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
            {RECORD.phases.map((p) => (
              <div key={p.k}>
                <div className="flex justify-between text-[12px] opacity-90">
                  <span>{p.k}</span>
                  <span style={{ fontFamily: VCR }}>{p.v}</span>
                </div>
                <div
                  className="mt-1.5 h-[4px]"
                  style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 4 }}
                >
                  <div className="h-full bg-white" style={{ width: `${p.v}%`, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-7 border-t pt-5" style={{ borderColor: 'rgba(255,255,255,0.25)' }}>
            <div className="text-[13px] opacity-85">Why it moved</div>
            <ul className="mt-2 space-y-2 text-[15px] leading-[1.4]">
              {RECORD.moved.map((m) => (
                <li key={m.phase}>
                  <span style={{ fontFamily: VCR, fontSize: 12 }}>
                    {m.phase} {m.delta > 0 ? `+${m.delta}` : m.delta}
                  </span>{' '}
                  <span className="opacity-90">{m.why}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6">
            <Btn kind="on-signal" onClick={() => go('press')}>
              See your record →
            </Btn>
          </div>
        </section>

        <EditableSection s={secs[1]} onSave={(b) => save(secs[1].id, b)} />

        {/* Pillars */}
        <Panel className="p-6 md:p-8">
          <Label>Pillars</Label>
          <ul className="mt-4 space-y-3">
            {PILLARS.map((p) => (
              <li key={p.name} className="flex items-center justify-between gap-3">
                <span
                  className="text-[18px]"
                  style={{ fontFamily: DISPLAY, letterSpacing: '-0.01em' }}
                >
                  {p.name}
                </span>
                <span
                  className="shrink-0 text-[12px]"
                  style={{ fontFamily: VCR, color: 'var(--v-muted)' }}
                >
                  {p.share}% / {p.posts} posts
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[13px]" style={{ color: 'var(--v-muted)' }}>
            Three is the number brands remember. Drag to reorder; the top one leads every move.
          </p>
        </Panel>

        <EditableSection s={secs[2]} onSave={(b) => save(secs[2].id, b)} />

        {/* What's working */}
        <Panel className="grid grid-cols-1 gap-8 p-6 md:col-span-2 md:grid-cols-2 md:p-8">
          <div>
            <Label>What&apos;s working</Label>
            <div className="mt-4 space-y-3">
              {WORKING.map((f) => (
                <div key={f.label}>
                  <div className="mb-1 flex justify-between text-[14px]">
                    <span>{f.label}</span>
                    <span style={{ fontFamily: VCR }}>{f.rate}%</span>
                  </div>
                  <div
                    className="h-[6px]"
                    style={{ background: 'var(--v-track)', borderRadius: 4 }}
                  >
                    <div
                      className="h-full"
                      style={{
                        width: `${(f.rate / 3.4) * 100}%`,
                        background: f.top ? 'var(--v-signal)' : 'var(--v-ink)',
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col">
            <Label>Your best post / 41× your usual</Label>
            <blockquote
              className="mt-4 border-l-2 pl-4 text-[20px] leading-[1.35]"
              style={{
                borderColor: 'var(--v-signal)',
                fontFamily: DISPLAY,
                letterSpacing: '-0.01em',
              }}
            >
              i asked 40 brands why they skipped creators. here is what they said.
            </blockquote>
            <p className="mt-3 text-[14px]" style={{ color: 'var(--v-muted)' }}>
              127K views on 21 Oct. Threads are your strongest format and 2% of what you post.
            </p>
            <div className="mt-auto pt-5">
              <Btn kind="secondary" onClick={() => go('write')}>
                Do more of this: write a thread
              </Btn>
            </div>
          </div>
        </Panel>

        <BodyOfWork />
      </div>

      {/* Workspaces open from here */}
      <div className="mt-12">
        <Label tone="head-muted">Workspaces</Label>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {(
            [
              ['canvas', 'Canvas', '2 boards · 2 ideas half-built'],
              ['write', 'Writing room', '1 draft waiting: part two'],
              ['framework', 'Frameworks', '2x2, before/after, loop, ladder'],
            ] as const
          ).map(([to, name, line]) => (
            <motion.button
              key={to}
              type="button"
              whileTap={reduce ? undefined : { scale: 0.98 }}
              onClick={() => go(to)}
              className="v2-focus min-h-[96px] p-5 text-left"
              style={{
                background: 'var(--v-surface)',
                color: 'var(--v-ink)',
                borderRadius: 18,
                boxShadow: 'inset 0 0 0 1px var(--v-rule)',
              }}
            >
              <div
                className="text-[22px]"
                style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: '-0.02em' }}
              >
                {name} →
              </div>
              <div className="mt-1 text-[14px]" style={{ color: 'var(--v-muted)' }}>
                {line}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <MockNote
        principle="Endowed progress + the IKEA effect. The page starts pre-filled from the scan (already past half done); every edit is pressed 'Yours' and moves the bar. Compounding made visible in Body of work."
        cut="Competitors table, audience list, lookups strip and the Index tile move off home (to ⌘K and a Brand tab); the Growth tile's four stats collapse into one 'since you joined' line."
      />
    </div>
  );
}
