'use client';

import { useState } from 'react';
import PostRow from '@/components/dashboard/PostRow';
import LookupStrip from '@/components/dashboard/LookupStrip';
import type { MemberRecord } from '@/lib/growth-data';
import { BIG, Label, MONO, T, Tile } from './parts';

/**
 * The member's own record on the growth dashboard (restored from the bento):
 * score history, the last 5 posts with their overnight breakdowns, and how
 * often the brand was looked up. The bento rows read `--d-*` colour tokens;
 * this block sets them to the growth dashboard's palette.
 */

const TOKENS = {
  '--d-tile': T.tile,
  '--d-rule': T.rule,
  '--d-ink': T.ink,
  '--d-muted': T.muted,
  '--d-track': T.track,
  '--d-blue': T.blue,
} as React.CSSProperties;

const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

/** Score per read, oldest → newest: a stepped line with the latest point in Klein. */
function HistoryLine({ points }: { points: MemberRecord['history'] }) {
  const w = 320;
  const h = 96;
  const values = points.map((p) => p.score);
  const lo = Math.max(0, Math.min(...values) - 6);
  const hi = Math.min(100, Math.max(...values) + 6);
  const x = (i: number) => (points.length === 1 ? w / 2 : (i / (points.length - 1)) * w);
  const y = (v: number) => h - ((v - lo) / Math.max(1, hi - lo)) * h;
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`);
  return (
    <svg
      viewBox={`-6 -6 ${w + 12} ${h + 12}`}
      className="mt-4 h-[108px] w-full"
      role="img"
      aria-label={`Brand score over ${points.length} reads, from ${values[0]} to ${values[values.length - 1]}`}
    >
      <path d={d.join(' ')} fill="none" stroke={T.ink} strokeWidth={1.5} />
      {points.map((p, i) => (
        <rect
          key={p.id}
          x={x(i) - 3}
          y={y(p.score) - 3}
          width={6}
          height={6}
          fill={i === points.length - 1 ? T.blue : T.ink}
        />
      ))}
    </svg>
  );
}

export function ScoreHistoryTile({ history }: { history: MemberRecord['history'] }) {
  const recent = [...history].reverse().slice(0, 4);
  return (
    <Tile className="md:col-span-5">
      <Label>Score history · {history.length} reads</Label>
      {history.length < 2 ? (
        <p className="mt-4 text-[14px] leading-[1.5]" style={{ color: T.muted }}>
          Your first read is on the record. The line starts with your next one.
        </p>
      ) : (
        <>
          <HistoryLine points={history.slice(-12)} />
          <ul className="mt-4 divide-y" style={{ borderColor: T.rule }}>
            {recent.map((r, i) => {
              const prev = history[history.length - 1 - i - 1];
              const delta = prev ? r.score - prev.score : null;
              return (
                <li
                  key={r.id}
                  className="flex items-baseline justify-between py-2 text-[13px]"
                  style={{ borderColor: T.rule }}
                >
                  <span style={{ fontFamily: MONO, color: T.muted }}>{day(r.at)}</span>
                  <span style={{ color: T.muted }}>
                    {delta === null
                      ? 'first read'
                      : delta === 0
                        ? 'no change'
                        : `${delta > 0 ? '▲' : '▼'} ${Math.abs(delta)}`}
                  </span>
                  <span
                    className="w-[44px] text-right text-[22px] leading-none"
                    style={{
                      fontFamily: BIG,
                      fontWeight: 500,
                      color: i === 0 ? T.blue : T.ink,
                    }}
                  >
                    {r.score}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Tile>
  );
}

export function LastPostsTile({ posts }: { posts: MemberRecord['posts'] }) {
  const [open, setOpen] = useState<string | null>(null);
  const best = Math.max(0, ...posts.map((p) => p.fit));
  return (
    <Tile className="md:col-span-7">
      <Label>Your last {posts.length || 5} posts · read overnight</Label>
      {posts.length === 0 ? (
        <p className="mt-4 text-[14px] leading-[1.5]" style={{ color: T.muted }}>
          BrandOS reads each new post overnight: how well it fits your brand, the voice, the format,
          the hook. Your next post shows up here tomorrow.
        </p>
      ) : (
        <ul className="mt-3" style={TOKENS}>
          {posts.map((p) => {
            const top = p.fit === best;
            return (
              <PostRow
                key={p.id}
                post={p}
                top={top}
                open={open === p.id}
                onToggle={() => setOpen((o) => (o === p.id ? null : p.id))}
                bar={
                  <div
                    className="h-full"
                    style={{ width: `${p.fit}%`, background: top ? T.blue : T.ink }}
                  />
                }
                figure={p.fit}
                roomy
              />
            );
          })}
        </ul>
      )}
    </Tile>
  );
}

export function LookupsBlock({
  handle,
  lookups,
}: {
  handle: string;
  lookups: NonNullable<MemberRecord['lookups']>;
}) {
  return (
    <div className="md:col-span-12" style={TOKENS}>
      <LookupStrip handle={handle} data={lookups} />
    </div>
  );
}
