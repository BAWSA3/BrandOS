'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimateNumber } from 'motion-plus/react';
import { useReducedMotion } from 'motion/react';
import Wordmark from '@/components/Wordmark';
import { FieldScreen } from '@/components/system';
import type { GrowthView, MemberRecord } from '@/lib/growth-data';
import { LastPostsTile, LookupsBlock, ScoreHistoryTile } from './RecordTiles';
import { proofParts } from '@/lib/growth-proof';
import IdeaBoard, { type Idea } from './IdeaBoard';
import { BIG, Bar, FollowersChart, Label, MONO, T, Tile, fmt } from './parts';
import IndexTile, { type IndexTileData } from './IndexTile';

const FIELD_EDGE = [
  [2, 0],
  [-2, 0],
  [0, 2],
  [0, -2],
  [2, 2],
  [-2, -2],
  [2, -2],
  [-2, 2],
]
  .map(([x, y]) => `${x}px ${y}px ${T.blue}`)
  .join(', ');

/**
 * The growth dashboard (pivot 2026-10-22): growing and scaling a brand, for
 * creators and the SMMs/agencies running several brands. One brand at a time
 * (switcher), real data from tracked accounts (src/lib/growth-data.ts).
 *
 * Motion+: one headline moment — the score rolls up in the Klein tile
 * (AnimateNumber). Everything else is still; reduced motion shows the value.
 *
 * `sample` = layout preview: no network calls, actions are inert.
 */

const PHASE_LABEL = { define: 'Define', check: 'Check', generate: 'Generate', scale: 'Scale' };

async function post(url: string, body?: unknown, method = 'POST') {
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
  if (!res.ok) throw new Error(json.error || 'Something went wrong. Try again.');
  return json;
}

function AddForm({
  placeholder,
  withKind,
  busy,
  onSubmit,
}: {
  placeholder: string;
  withKind?: boolean;
  busy: boolean;
  onSubmit: (handle: string, kind: 'creator' | 'brand') => void;
}) {
  const [handle, setHandle] = useState('');
  const [kind, setKind] = useState<'creator' | 'brand'>('brand');
  return (
    <form
      className="flex flex-col gap-2 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (handle.trim()) onSubmit(handle.trim(), kind);
      }}
    >
      <input
        autoFocus
        value={handle}
        onChange={(e) => setHandle(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full border px-3 py-2 text-[14px]"
        style={{ borderColor: T.rule, background: '#fff', borderRadius: 0 }}
      />
      {withKind && (
        <div className="flex gap-1" role="radiogroup" aria-label="Account type">
          {(['brand', 'creator'] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={kind === k}
              onClick={() => setKind(k)}
              className="flex-1 border px-2 py-1.5 text-[10px] uppercase tracking-[0.14em]"
              style={{
                fontFamily: MONO,
                borderColor: kind === k ? T.ink : T.rule,
                background: kind === k ? T.ink : 'transparent',
                color: kind === k ? '#fff' : T.muted,
              }}
            >
              {k === 'brand' ? 'Brand / company' : 'Creator'}
            </button>
          ))}
        </div>
      )}
      <button
        type="submit"
        disabled={busy || !handle.trim()}
        className="px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-white disabled:opacity-40"
        style={{ fontFamily: MONO, background: T.blue }}
      >
        {busy ? 'Reading X…' : 'Add →'}
      </button>
    </form>
  );
}

export default function GrowthDashboard({
  view,
  sample = false,
  ideas = [],
  index = null,
  field = false,
  record = null,
}: {
  view: GrowthView;
  /** The member's own record (history, last posts, lookups); null off their own brand. */
  record?: MemberRecord | null;
  /** Direction 03: the dashboard on the field (preview: ?field=1). */
  field?: boolean;
  sample?: boolean;
  ideas?: Idea[];
  /** The Creator Index tile (null while the Index is closed). */
  index?: IndexTileData | null;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState<null | 'brand' | 'competitor'>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const { brand, growth } = view;
  const target = view.score?.value ?? 0;

  // AnimateNumber only rolls when the value changes after mount
  useEffect(() => {
    const t = window.setTimeout(() => setScore(target), reduce ? 0 : 250);
    return () => window.clearTimeout(t);
  }, [reduce, target]);

  const run = async (fn: () => Promise<unknown>) => {
    if (sample) return;
    setBusy(true);
    setError(null);
    try {
      await fn();
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  };

  // stable between renders, so the board only resets when the server sends new ideas
  const boardIdeas = useMemo<Idea[]>(
    () =>
      sample
        ? ideas
        : view.ideas.map((i) => ({
            id: i.id,
            text: i.text,
            hook: i.hook || undefined,
            format: i.format,
            why: i.why || undefined,
            col: i.status === 'posted' ? 'posted' : i.status === 'drafting' ? 'drafting' : 'ideas',
            createdAt: i.createdAt,
          })),
    [sample, ideas, view.ideas]
  );
  const go = (id: string) => router.push(`/dashboard?brand=${encodeURIComponent(id)}`);
  const maxRate = Math.max(0, ...view.formats.map((f) => f.rate ?? 0));
  const comps = view.competitors;
  const maxCompEr = Math.max(0, ...comps.map((c) => c.engagement ?? 0));
  const others = comps.filter((c) => !c.you);
  const you = comps.find((c) => c.you);
  const leader = [...others].sort((a, b) => (b.engagement ?? 0) - (a.engagement ?? 0))[0];
  const kindLabel = brand.kind === 'brand' ? 'Brand' : 'Creator';
  const fewDays = growth.series.length < 2;

  const page = (
    <main
      className="min-h-screen pb-24"
      style={{ background: field ? 'transparent' : T.canvas, color: T.ink }}
    >
      {/* Top bar: the brand switcher is the first thing an SMM touches */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b px-4 py-3 md:px-8"
        style={{ background: T.canvas, borderColor: T.rule }}
      >
        <div className="flex items-center gap-4">
          <Wordmark height={20} />
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setOpen((o) => !o);
                setAdding(null);
              }}
              className="flex items-center gap-2 whitespace-nowrap border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em]"
              style={{ fontFamily: MONO, borderColor: T.rule, background: T.tile }}
              aria-expanded={open}
            >
              @{brand.handle}
              <span className="hidden sm:inline" style={{ color: T.muted }}>
                · {kindLabel}
              </span>
              <span aria-hidden>▾</span>
            </button>
            {open && (
              <div
                className="absolute left-0 top-full z-30 mt-1 w-[260px] border"
                style={{ background: T.tile, borderColor: T.rule }}
              >
                <div className="px-3 pb-1 pt-3">
                  <Label>
                    Your brands · {view.brands.length} of {view.limits.brands}
                  </Label>
                </div>
                {view.brands.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      if (b.id !== brand.id && !sample) go(b.id);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-[14px] hover:bg-black/[0.04]"
                    style={{ fontWeight: b.id === brand.id ? 600 : 400 }}
                  >
                    <span>@{b.handle}</span>
                    <span
                      className="text-[9px] uppercase tracking-[0.14em]"
                      style={{ fontFamily: MONO, color: T.muted }}
                    >
                      {b.kind === 'brand' ? 'Brand' : 'Creator'}
                    </span>
                  </button>
                ))}
                {adding === 'brand' ? (
                  <div className="border-t" style={{ borderColor: T.rule }}>
                    <AddForm
                      placeholder="@handle of a brand you run"
                      withKind
                      busy={busy}
                      onSubmit={(handle, kind) =>
                        run(async () => {
                          const r = await post('/api/accounts', { handle, kind });
                          setOpen(false);
                          setAdding(null);
                          if (r.id) go(r.id);
                        })
                      }
                    />
                  </div>
                ) : view.brands.length < view.limits.brands ? (
                  <button
                    type="button"
                    onClick={() => setAdding('brand')}
                    className="w-full border-t px-3 py-2.5 text-left text-[11px] uppercase tracking-[0.14em]"
                    style={{ fontFamily: MONO, borderColor: T.rule, color: T.blue }}
                  >
                    + Add a brand
                  </button>
                ) : (
                  <div
                    className="border-t px-3 py-2.5 text-[12px]"
                    style={{ borderColor: T.rule, color: T.muted }}
                  >
                    Your plan tracks {view.limits.brands}. Team and Agency track more.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => run(() => post(`/api/accounts/${brand.id}/sync`))}
            disabled={busy}
            className="border px-2 py-1 text-[10px] uppercase tracking-[0.14em] disabled:opacity-50"
            style={{ fontFamily: MONO, borderColor: T.rule, color: T.muted }}
            title={
              brand.lastSyncedAt
                ? `Last read ${new Date(brand.lastSyncedAt).toLocaleString()}`
                : 'Not read yet'
            }
          >
            {busy ? 'Reading…' : '↻ Refresh'}
          </button>
        </div>
      </header>

      {error && (
        <div
          className="mx-4 mt-4 border px-3 py-2 text-[13px] md:mx-8"
          style={{ borderColor: '#F3C2C2', background: '#FDF1F1', color: '#9B1C1C' }}
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="mx-auto w-full max-w-[1240px] px-4 md:px-8">
        {/* Masthead */}
        <div className="pb-8 pt-10 md:pt-14" style={field ? { color: '#fff' } : undefined}>
          <span
            style={
              field
                ? {
                    display: 'inline-block',
                    background: T.blue,
                    padding: '4px 8px',
                    marginLeft: -8,
                  }
                : undefined
            }
          >
            <Label color={field ? 'rgba(255,255,255,0.9)' : undefined}>
              {[
                kindLabel,
                view.score?.archetype,
                growth.followers !== null ? `${fmt.int(growth.followers)} followers` : null,
                growth.trackedDays
                  ? `tracked ${growth.trackedDays} day${growth.trackedDays === 1 ? '' : 's'}`
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Label>
          </span>
          <h1
            className="mt-3 break-all text-[52px] leading-[0.9] md:text-[104px]"
            style={{
              fontFamily: BIG,
              fontWeight: 500,
              letterSpacing: '-0.05em',
              // On the field: a crisp Klein edge so the dots never cut into the handle.
              ...(field ? { textShadow: FIELD_EDGE } : {}),
            }}
          >
            @{brand.handle}
          </h1>
          {record?.proof && (
            <p
              className="mt-4 text-[11px] uppercase tracking-[0.14em]"
              style={{ fontFamily: MONO }}
            >
              <span
                style={
                  field
                    ? { background: T.blue, color: '#fff', padding: '2px 6px' }
                    : { color: T.ink }
                }
              >
                Since you joined · {proofParts(record.proof).join(' · ')}
              </span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          {/* Score: the one Klein moment */}
          <section
            className="p-6 text-white md:col-span-5 md:p-8"
            style={{
              background: T.blue,
              // On the field the Klein tile needs an edge, or it melts into the blue.
              ...(field ? { outline: '1px solid rgba(255,255,255,0.9)', outlineOffset: -1 } : {}),
            }}
          >
            <div className="flex items-center justify-between">
              <Label color="rgba(255,255,255,0.75)">Brand score</Label>
              {view.score && (
                <span
                  className="text-[10px] uppercase tracking-[0.14em] opacity-75"
                  style={{ fontFamily: MONO }}
                >
                  read{' '}
                  {new Date(view.score.scannedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              )}
            </div>
            {view.score ? (
              <>
                <div className="mt-4 flex items-baseline gap-2">
                  <AnimateNumber
                    className="text-[96px] leading-none md:text-[120px]"
                    style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.05em' }}
                    transition={reduce ? { duration: 0 } : undefined}
                  >
                    {score}
                  </AnimateNumber>
                  <span className="text-[14px] opacity-70" style={{ fontFamily: MONO }}>
                    /100
                  </span>
                </div>
                {record?.move && record.move.to === view.score.value && record.move.delta !== 0 && (
                  <div
                    className="mt-2 text-[11px] uppercase tracking-[0.14em]"
                    style={{ fontFamily: MONO }}
                  >
                    {record.move.delta > 0 ? '▲' : '▼'} {Math.abs(record.move.delta)} since{' '}
                    {new Date(record.move.since).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      timeZone: 'UTC',
                    })}
                  </div>
                )}
                {view.score.phases && (
                  <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
                    {(Object.keys(PHASE_LABEL) as (keyof typeof PHASE_LABEL)[]).map((k) => (
                      <div key={k}>
                        <div
                          className="flex justify-between text-[10px] uppercase tracking-[0.14em]"
                          style={{ fontFamily: MONO }}
                        >
                          <span className="opacity-80">{PHASE_LABEL[k]}</span>
                          <span>{view.score!.phases![k]}</span>
                        </div>
                        <div className="mt-1.5 h-[4px] bg-white/25">
                          <div
                            className="h-full bg-white"
                            style={{ width: `${view.score!.phases![k]}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {view.score.weakest && (
                  <p className="mt-6 text-[14px] leading-[1.5] opacity-90">
                    {PHASE_LABEL[view.score.weakest]} is the weakest phase. That&apos;s where the
                    next points are.
                  </p>
                )}
              </>
            ) : (
              <div className="mt-6">
                <p className="text-[18px] leading-[1.4]">No brand read for @{brand.handle} yet.</p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => post('/api/public-brand', { handle: brand.handle }))}
                  className="mt-5 bg-white px-5 py-3 text-[11px] uppercase tracking-[0.14em] disabled:opacity-60"
                  style={{ fontFamily: MONO, color: T.blue }}
                >
                  {busy ? 'Reading the brand…' : 'Get the score →'}
                </button>
              </div>
            )}
          </section>

          {/* Growth */}
          <Tile className="md:col-span-7">
            <Label>Growth</Label>
            <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-4">
              {[
                [
                  'Followers',
                  fmt.int(growth.followers),
                  growth.followers7 !== null
                    ? `${growth.followers7 >= 0 ? '+' : ''}${fmt.int(growth.followers7)} this week`
                    : 'weekly change soon',
                ],
                [
                  'Engagement',
                  fmt.pct(growth.engagement),
                  fmt.signed(growth.engagement7, 1, ' vs last week') ?? 'of views engage',
                ],
                [
                  'Posts / day',
                  growth.postsPerDay === null ? '—' : growth.postsPerDay.toFixed(1),
                  `${growth.samplePosts} recent posts`,
                ],
                [
                  'Avg views',
                  fmt.compact(growth.avgViews),
                  fmt.signed(growth.avgViews7, 0, '% vs last week') ?? 'per post',
                ],
              ].map(([k, v, s]) => (
                <div key={k}>
                  <Label>{k}</Label>
                  <div
                    className="mt-1.5 text-[30px] leading-none"
                    style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.03em' }}
                  >
                    {v}
                  </div>
                  <div className="mt-1 text-[12px]" style={{ color: T.muted }}>
                    {s}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              {fewDays ? (
                <div
                  className="border border-dashed p-5 text-[13px] leading-[1.5]"
                  style={{ borderColor: T.rule, color: T.muted }}
                >
                  Tracking started {growth.trackedDays ? 'today' : 'just now'}. BrandOS checks @
                  {brand.handle} every day, and the follower line fills in from here (X doesn&apos;t
                  share follower history).
                </div>
              ) : (
                <FollowersChart series={growth.series} />
              )}
            </div>
          </Tile>

          {/* The member's own record (score history, last posts), restored from the bento */}
          {record && (
            <>
              <ScoreHistoryTile history={record.history} move={record.move} handle={brand.handle} />
              <LastPostsTile posts={record.posts} />
            </>
          )}

          {/* Post performance */}
          <Tile className="md:col-span-8">
            <Label>What&apos;s working · last {growth.samplePosts} posts</Label>
            {view.formats.length === 0 ? (
              <p className="mt-4 text-[14px]" style={{ color: T.muted }}>
                No recent original posts to read yet.
              </p>
            ) : (
              <div className="mt-5 grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  <div className="text-[13px]" style={{ color: T.muted }}>
                    Engagement by format
                  </div>
                  <div className="mt-3 space-y-3.5">
                    {view.formats.map((f) => (
                      <div key={f.format}>
                        <div className="mb-1 flex justify-between text-[13px]">
                          <span>
                            {f.label}
                            <span style={{ color: T.muted }}> · {f.share}% of posts</span>
                          </span>
                          <span style={{ fontFamily: MONO }}>{fmt.pct(f.rate)}</span>
                        </div>
                        <Bar
                          value={f.rate ?? 0}
                          max={maxRate}
                          accent={f.rate === maxRate && maxRate > 0}
                        />
                      </div>
                    ))}
                  </div>
                  {view.peakHour !== null && (
                    <p className="mt-4 text-[13px] leading-[1.5]" style={{ color: T.muted }}>
                      Best time to post: around {String(view.peakHour).padStart(2, '0')}:00 UTC.
                    </p>
                  )}
                  {view.outlier && (
                    <p className="mt-3 text-[13px] leading-[1.5]" style={{ color: T.muted }}>
                      <a
                        href={`https://x.com/${brand.handle}/status/${view.outlier.tweetId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="underline-offset-2 hover:underline"
                        style={{ color: T.ink }}
                      >
                        One post did {fmt.compact(view.outlier.views)} views
                      </a>
                      , {view.outlier.multiple}× your usual. The numbers above are your typical
                      post, so one standout doesn&apos;t skew them.
                    </p>
                  )}
                </div>
                <div>
                  <div className="text-[13px]" style={{ color: T.muted }}>
                    Best and worst posts
                  </div>
                  <ul className="mt-3 space-y-4">
                    {[
                      ...view.best.map((p) => ({ ...p, low: false })),
                      ...(view.worst ? [{ ...view.worst, low: true }] : []),
                    ].map((p) => (
                      <li
                        key={p.tweetId}
                        className="border-l-2 pl-3"
                        style={{ borderColor: p.low ? T.rule : T.blue }}
                      >
                        <a
                          href={`https://x.com/${brand.handle}/status/${p.tweetId}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[14px] leading-[1.4] hover:underline"
                        >
                          “{p.text.length > 140 ? `${p.text.slice(0, 140)}…` : p.text}”
                        </a>
                        <div className="mt-1 text-[12px]" style={{ color: T.muted }}>
                          <span style={{ fontFamily: MONO, color: p.low ? T.muted : T.ink }}>
                            {p.rate.toFixed(1)}%
                          </span>{' '}
                          · {p.why}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Tile>

          {/* Next moves */}
          <Tile className="md:col-span-4">
            <Label>Next moves</Label>
            {view.score?.nextMoves.length ? (
              <ol className="mt-4 space-y-4">
                {view.score.nextMoves.map((m, i) => (
                  <li key={m} className="flex gap-3 text-[14px] leading-[1.45]">
                    <span style={{ fontFamily: MONO, color: T.blue }}>0{i + 1}</span>
                    {m}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-4 text-[14px]" style={{ color: T.muted }}>
                Next moves appear with the brand read.
              </p>
            )}
          </Tile>

          {record?.lookups && <LookupsBlock handle={brand.handle} lookups={record.lookups} />}

          {/* Competitors */}
          <Tile className="md:col-span-7">
            <div className="flex items-center justify-between">
              <Label>Competitors</Label>
              {others.length < view.limits.competitors && adding !== 'competitor' && (
                <button
                  type="button"
                  onClick={() => setAdding('competitor')}
                  className="text-[10px] uppercase tracking-[0.14em]"
                  style={{ fontFamily: MONO, color: T.blue }}
                >
                  + Add ({others.length} of {view.limits.competitors})
                </button>
              )}
            </div>
            {adding === 'competitor' && (
              <div className="mt-3 border" style={{ borderColor: T.rule, background: T.canvas }}>
                <AddForm
                  placeholder="@handle to compare against"
                  busy={busy}
                  onSubmit={(handle) =>
                    run(async () => {
                      await post('/api/accounts', { handle, competitorOf: brand.id });
                      setAdding(null);
                    })
                  }
                />
              </div>
            )}
            {others.length === 0 && adding !== 'competitor' ? (
              <p className="mt-4 text-[14px] leading-[1.5]" style={{ color: T.muted }}>
                Add up to {view.limits.competitors} accounts to benchmark @{brand.handle} against:
                score, engagement, posting rate and growth, side by side.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[460px] text-left text-[13px]">
                  <thead>
                    <tr style={{ color: T.muted }}>
                      {['', 'Score', 'Engagement', 'Posts/day', 'Followers', ''].map((h, i) => (
                        <th
                          key={i}
                          className="pb-2 text-[10px] font-normal uppercase tracking-[0.14em]"
                          style={{ fontFamily: MONO }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comps.map((c) => (
                      <tr key={c.id} className="border-t" style={{ borderColor: T.rule }}>
                        <td className="py-2.5 pr-3">
                          @{c.handle}
                          {c.you && (
                            <span
                              className="ml-2 text-[9px] uppercase tracking-[0.14em]"
                              style={{ fontFamily: MONO, color: T.blue }}
                            >
                              you
                            </span>
                          )}
                        </td>
                        <td style={{ fontFamily: MONO }}>{c.score ?? '—'}</td>
                        <td className="pr-4">
                          <div className="flex items-center gap-2">
                            <span className="w-12" style={{ fontFamily: MONO }}>
                              {fmt.pct(c.engagement)}
                            </span>
                            <div className="w-20">
                              <Bar value={c.engagement ?? 0} max={maxCompEr} accent={c.you} />
                            </div>
                          </div>
                        </td>
                        <td style={{ fontFamily: MONO }}>
                          {c.postsPerDay === null ? '—' : c.postsPerDay.toFixed(1)}
                        </td>
                        <td style={{ fontFamily: MONO }}>{fmt.compact(c.followers)}</td>
                        <td className="text-right">
                          {!c.you && (
                            <button
                              type="button"
                              aria-label={`Stop comparing with @${c.handle}`}
                              onClick={() =>
                                run(() => post(`/api/accounts/${c.id}`, undefined, 'DELETE'))
                              }
                              className="px-1 text-[14px]"
                              style={{ color: T.muted }}
                            >
                              ×
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {leader &&
              you &&
              leader.engagement !== null &&
              you.engagement !== null &&
              leader.engagement > you.engagement && (
                <p className="mt-4 text-[13px] leading-[1.5]" style={{ color: T.muted }}>
                  @{leader.handle} earns{' '}
                  {(leader.engagement / Math.max(you.engagement, 0.01)).toFixed(1)}× your engagement
                  {leader.mediaShare !== null
                    ? `, and ${Math.round(leader.mediaShare * 100)}% of their posts carry media`
                    : ''}
                  .
                </p>
              )}
          </Tile>

          {/* Audience: who replies to and reposts this brand (public data, last 30 days) */}
          <Tile className="md:col-span-5">
            <Label>Audience · last 30 days</Label>
            {!view.audience ? (
              <p className="mt-4 text-[14px] leading-[1.5]" style={{ color: T.muted }}>
                Who replies to and reposts @{brand.handle}, and who keeps coming back. BrandOS reads
                it from {brand.handle}&apos;s best recent posts; it appears after the next refresh.
              </p>
            ) : (
              <>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div
                      className="text-[30px] leading-none"
                      style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.03em' }}
                    >
                      {fmt.int(view.audience.people)}
                    </div>
                    <div className="mt-1 text-[12px]" style={{ color: T.muted }}>
                      people replied, reposted or quoted
                    </div>
                  </div>
                  <div>
                    <div
                      className="text-[30px] leading-none"
                      style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.03em' }}
                    >
                      {view.audience.returningShare === null
                        ? '—'
                        : `${Math.round(view.audience.returningShare * 100)}%`}
                    </div>
                    <div className="mt-1 text-[12px]" style={{ color: T.muted }}>
                      came back on more than one post
                    </div>
                  </div>
                </div>
                <div className="mt-5 text-[13px]" style={{ color: T.muted }}>
                  Who engages most
                </div>
                <ul className="mt-2">
                  {view.audience.topEngagers.map((e) => (
                    <li
                      key={e.handle}
                      className="flex items-center justify-between gap-3 border-t py-2 text-[13px]"
                      style={{ borderColor: T.rule }}
                    >
                      <a
                        href={`https://x.com/${e.handle}`}
                        target="_blank"
                        rel="noreferrer"
                        className="truncate hover:underline"
                      >
                        @{e.handle}
                        {e.followers >= 10_000 && (
                          <span className="ml-1.5" style={{ color: T.muted }}>
                            · {fmt.compact(e.followers)}
                          </span>
                        )}
                      </a>
                      <span className="shrink-0" style={{ fontFamily: MONO, color: T.muted }}>
                        {e.replies} repl{e.replies === 1 ? 'y' : 'ies'} · {e.reposts} repost
                        {e.reposts === 1 ? '' : 's'}
                      </span>
                    </li>
                  ))}
                </ul>
                {view.audience.topAmplifiers[0] && (
                  <p className="mt-3 text-[13px] leading-[1.5]" style={{ color: T.muted }}>
                    @{view.audience.topAmplifiers[0].handle} amplifies @{brand.handle} most. A reply
                    back keeps them coming.
                  </p>
                )}
              </>
            )}
          </Tile>

          {index && <IndexTile data={index} />}

          <IdeaBoard
            key={brand.id}
            handle={brand.handle}
            name={brand.name}
            avatarUrl={brand.avatarUrl}
            accountId={sample ? undefined : brand.id}
            initial={boardIdeas}
          />
        </div>

        {sample && (
          <p
            className="mt-10 text-center text-[10px] uppercase tracking-[0.16em]"
            style={{ fontFamily: MONO, color: T.muted }}
          >
            Layout preview · sample data
          </p>
        )}
      </div>
    </main>
  );
  return field ? <FieldScreen signalCell="none">{page}</FieldScreen> : page;
}
