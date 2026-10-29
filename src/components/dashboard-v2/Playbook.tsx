'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { AnimateNumber } from 'motion-plus/react';
import type { WeekOfWork } from '@/lib/playbook';
import { workLine } from '@/lib/playbook';
import { recordDate } from '@/lib/classifications';
import { ButtonLink, DISPLAY, Label, Panel, VCR } from './ui';
import InfoTip, { TIPS } from './InfoTip';

/**
 * The Playbook (dashboard v2, slice 2): the brand's living page, read-only
 * for now. Pre-filled from the member's read (endowed progress: it's never
 * empty), with the Record as the one Klein tile and the body of work showing
 * the compounding. Editing in place arrives with its migration (a later slice).
 *
 * Motion+ headline: the score rolls up in the Record tile. Nothing else moves.
 */

export interface PlaybookData {
  handle: string;
  entryNo: number | null;
  /** "CLASS 04 / ARC" (VCR has no "·" glyph) */
  classification: string | null;
  /** the latest read, "23 OCT 2026" */
  readOn: string | null;
  proof: string | null;
  positioning: string | null;
  pillars: string[];
  strengths: string[];
  gap: string | null;
  voice: string[];
  working: { label: string; rate: number; share: number; top: boolean }[];
  best: { text: string; why: string; href: string } | null;
  record: {
    score: number;
    delta: number | null;
    since: string | null;
    phases: { k: string; v: number }[];
    moved: { phase: string; delta: number; why: string }[];
  } | null;
  weeks: WeekOfWork[];
  links: { brand: string; board: string; write: string; doMore: string | null };
}

function FromRead() {
  return (
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

function Section({
  label,
  tip,
  children,
  read = true,
  className = '',
}: {
  label: string;
  /** the plain sentence behind the "i" (key terms only) */
  tip?: string;
  children: React.ReactNode;
  read?: boolean;
  className?: string;
}) {
  return (
    <Panel className={`p-6 md:p-8 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <Label>
          {label}
          {tip && <InfoTip label={label}>{tip}</InfoTip>}
        </Label>
        {read && <FromRead />}
      </div>
      <div className="mt-4">{children}</div>
    </Panel>
  );
}

function RecordTile({
  r,
  readOn,
  href,
}: {
  r: NonNullable<PlaybookData['record']>;
  readOn: string | null;
  href: string;
}) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setShown(r.score), reduce ? 0 : 300);
    return () => window.clearTimeout(t);
  }, [r.score, reduce]);
  return (
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
          <InfoTip label="the Record">{TIPS.record}</InfoTip>
        </Label>
        {readOn && (
          <Label tone="on-signal" style={{ opacity: 0.85 }}>
            Read {readOn}
          </Label>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <AnimateNumber
          className="text-[96px] leading-none md:text-[120px]"
          style={{ fontFamily: DISPLAY, fontWeight: 500, letterSpacing: '-0.05em' }}
          transition={reduce ? { duration: 0 } : { type: 'spring', duration: 1.3, bounce: 0 }}
        >
          {shown}
        </AnimateNumber>
        <span className="text-[13px] opacity-80" style={{ fontFamily: VCR }}>
          /100
        </span>
      </div>
      {r.delta ? (
        <div className="mt-2 text-[14px] opacity-90">
          {r.delta > 0 ? '▲' : '▼'} {Math.abs(r.delta)}
          {r.since ? ` since ${r.since}` : ''}
        </div>
      ) : null}
      {r.phases.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
          {r.phases.map((p) => (
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
      )}
      {r.moved.length > 0 && (
        <div className="mt-7 border-t pt-5" style={{ borderColor: 'rgba(255,255,255,0.25)' }}>
          <div className="text-[13px] opacity-85">Why it moved</div>
          <ul className="mt-2 space-y-2 text-[15px] leading-[1.4]">
            {r.moved.map((m) => (
              <li key={m.phase}>
                <span style={{ fontFamily: VCR, fontSize: 12 }}>
                  {m.phase} {m.delta > 0 ? `+${m.delta}` : m.delta}
                </span>{' '}
                <span className="opacity-90">{m.why}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-6">
        <ButtonLink href={href} kind="on-signal">
          Score history and posts →
        </ButtonLink>
      </div>
    </section>
  );
}

function BodyOfWork({ weeks }: { weeks: WeekOfWork[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.ideas + w.posts));
  const scores = weeks.map((w) => w.score).filter((s): s is number => s !== null);
  const lo = Math.min(...scores, 100) - 4;
  const hi = Math.max(...scores, 0) + 4;
  const H = 140;
  const line = workLine(weeks);
  // "2 SEP" (recordDate without the year; ICU's en-GB short month says "Sept")
  const fmt = (iso: string) => recordDate(iso).split(' ').slice(0, 2).join(' ');
  return (
    <Panel className="p-6 md:col-span-2 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label>Body of work / {weeks.length} weeks</Label>
        {line && (
          <span className="text-[13px]" style={{ color: 'var(--v-muted)' }}>
            {line}
          </span>
        )}
      </div>
      {!line ? (
        <p className="mt-4 text-[15px] leading-[1.5]" style={{ color: 'var(--v-muted)' }}>
          Your ideas, drafts and posts stack up here week by week. Today&apos;s move is the first
          block.
        </p>
      ) : (
        <>
          <div
            className="relative mt-6"
            role="img"
            aria-label={`Body of work over ${weeks.length} weeks: ${line}`}
          >
            <div className="flex items-end gap-2 md:gap-4" style={{ height: H }}>
              {weeks.map((w, i) => {
                const k = (n: number) => `${(n / max) * 100}%`;
                const last = i === weeks.length - 1;
                return (
                  <div key={w.start} className="flex h-full flex-1 flex-col justify-end">
                    <div
                      style={{
                        height: k(Math.max(0, w.ideas - w.drafts)),
                        background: 'var(--v-track)',
                        borderRadius: '6px 6px 0 0',
                      }}
                    />
                    <div
                      style={{ height: k(w.drafts), background: 'var(--v-muted)', opacity: 0.45 }}
                    />
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
            {scores.length >= 2 && (
              <svg
                className="pointer-events-none absolute inset-x-0 top-0"
                viewBox={`0 0 ${weeks.length * 10} ${H}`}
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
                  points={weeks
                    .map((w, i) =>
                      w.score === null
                        ? null
                        : `${i * 10 + 5},${H - ((w.score - lo) / (hi - lo)) * H}`
                    )
                    .filter(Boolean)
                    .join(' ')}
                />
              </svg>
            )}
          </div>
          <div
            className="mt-2 flex justify-between text-[10px]"
            style={{ fontFamily: VCR, color: 'var(--v-muted)' }}
          >
            <span>{fmt(weeks[0].start)}</span>
            <span>THIS WEEK</span>
          </div>
          <div
            className="mt-3 flex flex-wrap gap-4 text-[12px]"
            style={{ color: 'var(--v-muted)' }}
          >
            <span>▮ posts</span>
            <span>▮ drafts</span>
            <span>▮ ideas</span>
            {scores.length >= 2 && <span style={{ color: 'var(--v-signal-text)' }}>- - score</span>}
          </div>
        </>
      )}
    </Panel>
  );
}

export default function Playbook({ data }: { data: PlaybookData }) {
  const d = data;
  const maxRate = Math.max(0.01, ...d.working.map((w) => w.rate));
  // the sharpen panel spans both columns when it would otherwise sit alone in its row
  const before =
    (d.positioning ? 1 : 0) +
    (d.record ? 2 : 0) +
    (d.strengths.length ? 1 : 0) +
    (d.pillars.length ? 1 : 0) +
    (d.voice.length ? 1 : 0);
  const gapAlone = before % 2 === 0;
  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pb-10 pt-6 md:px-10 md:pt-14">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label tone="head-muted">
          Playbook{d.entryNo !== null ? ` / Entry No. ${String(d.entryNo).padStart(4, '0')}` : ''}
        </Label>
        {!d.record && d.readOn && <Label tone="head-muted">Read {d.readOn}</Label>}
      </div>
      <h1
        className="mt-4 break-all text-[44px] leading-[0.95] md:text-[88px]"
        style={{
          fontFamily: DISPLAY,
          fontWeight: 500,
          letterSpacing: '-0.05em',
          color: 'var(--v-head)',
        }}
      >
        @{d.handle}
      </h1>
      <div
        className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px]"
        style={{ color: 'var(--v-head-muted)' }}
      >
        {d.classification && (
          <span style={{ fontFamily: VCR, fontSize: 12, letterSpacing: '0.12em' }}>
            {d.classification}
            <InfoTip label="your classification">{TIPS.classification}</InfoTip>
          </span>
        )}
        {d.proof && <span>Since you joined: {d.proof}</span>}
      </div>
      <p className="mt-6 max-w-[560px] text-[14px]" style={{ color: 'var(--v-head-muted)' }}>
        Pre-filled from your read, so it&apos;s never a blank page. It sharpens with every read and
        every post.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
        {d.positioning ? (
          <Section label="Positioning">
            <p
              className="text-[22px] leading-[1.35] md:text-[24px]"
              style={{ fontFamily: DISPLAY, letterSpacing: '-0.02em' }}
            >
              {d.positioning}
            </p>
          </Section>
        ) : null}

        {d.record ? <RecordTile r={d.record} readOn={d.readOn} href={d.links.brand} /> : null}

        {d.strengths.length > 0 && (
          <Section label="Known for" tip={TIPS.known}>
            <ul className="space-y-2 text-[17px] leading-[1.45]">
              {d.strengths.slice(0, 3).map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </Section>
        )}

        {d.pillars.length > 0 && (
          <Section label="Pillars">
            <ul className="space-y-3">
              {d.pillars.slice(0, 5).map((p) => (
                <li
                  key={p}
                  className="text-[18px]"
                  style={{ fontFamily: DISPLAY, letterSpacing: '-0.01em' }}
                >
                  {p}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {d.voice.length > 0 && (
          <Section label="Voice and consistency">
            <ul className="space-y-2 text-[16px] leading-[1.5]">
              {d.voice.slice(0, 3).map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </Section>
        )}

        {d.gap && (
          <Section label="One thing to sharpen" tip={TIPS.sharpen} className={gapAlone ? 'md:col-span-2' : ''}>
            <p className="text-[17px] leading-[1.5]">{d.gap}</p>
            <div className="mt-5">
              <ButtonLink href={d.links.write} kind="secondary">
                Work on it →
              </ButtonLink>
            </div>
          </Section>
        )}

        {d.working.length > 0 && (
          <Panel className="grid grid-cols-1 gap-8 p-6 md:col-span-2 md:grid-cols-2 md:p-8">
            <div>
              <Label>
                What&apos;s working
                <InfoTip label="what's working">{TIPS.working}</InfoTip>
              </Label>
              <div className="mt-4 space-y-3">
                {d.working.map((f) => (
                  <div key={f.label}>
                    <div className="mb-1 flex justify-between text-[14px]">
                      <span>
                        {f.label}
                        <span style={{ color: 'var(--v-muted)' }}> · {f.share}% of posts</span>
                      </span>
                      <span style={{ fontFamily: VCR }}>{f.rate.toFixed(1)}%</span>
                    </div>
                    <div
                      className="h-[6px]"
                      style={{ background: 'var(--v-track)', borderRadius: 4 }}
                    >
                      <div
                        className="h-full"
                        style={{
                          width: `${Math.max(2, (f.rate / maxRate) * 100)}%`,
                          background: f.top ? 'var(--v-signal)' : 'var(--v-ink)',
                          borderRadius: 4,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {d.best && (
              <div className="flex flex-col">
                <Label>Your best recent post</Label>
                <blockquote
                  className="mt-4 border-l-2 pl-4 text-[19px] leading-[1.4]"
                  style={{ borderColor: 'var(--v-signal)', fontFamily: DISPLAY }}
                >
                  <a
                    href={d.best.href}
                    target="_blank"
                    rel="noreferrer"
                    className="v2-focus hover:underline"
                  >
                    “{d.best.text}”
                  </a>
                </blockquote>
                <p className="mt-3 text-[14px]" style={{ color: 'var(--v-muted)' }}>
                  {d.best.why}
                </p>
                {d.links.doMore && (
                  <div className="mt-auto pt-5">
                    <ButtonLink href={d.links.doMore} kind="secondary">
                      Do more of this →
                    </ButtonLink>
                  </div>
                )}
              </div>
            )}
          </Panel>
        )}

        <BodyOfWork weeks={d.weeks} />
      </div>

      <div className="mt-12">
        <Label tone="head-muted">Work on it</Label>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {(
            [
              [d.links.write, 'Write', 'Posts and emails in your voice, scored before they go out'],
              [d.links.board, 'Idea board', 'Ideas from your numbers, and your own'],
              [d.links.brand, 'Brand analytics', 'Growth, competitors and audience'],
            ] as const
          ).map(([href, name, line]) => (
            <Link
              key={name}
              href={href}
              className="v2-focus v2-press block min-h-[96px] p-5"
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
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
