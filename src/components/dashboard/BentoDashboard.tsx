'use client';

import Link from 'next/link';
import { useState } from 'react';
import BrandPass, { type BrandPassData } from '@/components/dashboard/BrandPass';
import { DASH_FONTS } from '@/components/dashboard/dashFonts';
import { STUDIO_STEPS, type StageNumber } from '@/lib/studio-stages';

// The dashboard (docs/specs/TITLE-SCREEN-AND-DASHBOARD.md): dark bento grid,
// Klein blue as the only accent, mono labels + Inter Tight for big numbers.
// New users see the three onboarding steps as "start here" tiles; each one,
// once done, becomes its real tile and builds a floor on the title screen.

const C = {
  canvas: 'var(--d-canvas)',
  tile: 'var(--d-tile)',
  rule: 'var(--d-rule)',
  ink: 'var(--d-ink)',
  muted: 'var(--d-muted)',
  dim: 'var(--d-dim)',
  bar: 'var(--d-bar)',
  track: 'var(--d-track)',
  blue: '#0047FF',
  bone: '#ECE9E1',
};

export type DashTheme = 'dark' | 'light';

// Neutral base per theme; Klein blue is the one bright signal in both.
const THEMES: Record<DashTheme, Record<string, string>> = {
  dark: {
    '--d-canvas': '#0B0B0C',
    '--d-tile': '#161618',
    '--d-rule': 'rgba(231,231,228,0.08)',
    '--d-ink': '#E7E7E4',
    '--d-muted': '#8A8A86',
    '--d-dim': '#55554F',
    '--d-bar': '#B9B8AE',
    '--d-track': 'rgba(231,231,228,0.1)',
    '--d-callout': '#C9C8C2',
    '--d-callout-line': 'rgba(231,231,228,0.45)',
  },
  light: {
    '--d-canvas': '#E7E7E4',
    '--d-tile': '#F6F5F1',
    '--d-rule': 'rgba(14,14,14,0.09)',
    '--d-ink': '#0E0E0E',
    '--d-muted': '#6B6B6B',
    '--d-dim': '#B5B4AE',
    '--d-bar': '#1C1C1C',
    '--d-track': 'rgba(14,14,14,0.08)',
    '--d-callout': '#4A4A47',
    '--d-callout-line': 'rgba(14,14,14,0.4)',
  },
};
// Type roles come from CSS vars so fonts can be swapped (see dashFonts.ts).
const MONO = "var(--dash-mono, 'VCR OSD Mono', monospace)";
const BIG = "var(--dash-big, 'Inter Tight', sans-serif)";

export interface RecentPost {
  id: string;
  excerpt: string;
  when: string;
  fit: number;
  likes: number;
  multiple: string; // "2.0x"
}

export interface DashboardData {
  handle: string;
  avatarUrl?: string | null;
  stage: StageNumber;
  ticker: { followers: string; change7d: string; score: number; streak: string; avgFit: number };
  scoreHistory: { label: string; value: number }[];
  streak: { done: number; target: number };
  posts: RecentPost[];
  pass: BrandPassData;
}

function Label({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div
      className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em]"
      style={{ fontFamily: MONO, color: C.muted }}
    >
      <span>{children}</span>
      {right}
    </div>
  );
}

function Tile({
  children,
  className = '',
  accent = false,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
}) {
  // A Klein-blue tile flips the theme's ink to white so labels and numbers read on it.
  const onBlue = accent
    ? {
        '--d-ink': '#FFFFFF',
        '--d-muted': 'rgba(255,255,255,0.72)',
        '--d-bar': 'rgba(255,255,255,0.38)',
      }
    : {};
  return (
    <section
      className={`relative flex flex-col p-5 ${className}`}
      style={
        {
          ...onBlue,
          background: accent ? C.blue : C.tile,
          border: `1px solid ${accent ? C.blue : C.rule}`,
          color: C.ink,
        } as React.CSSProperties
      }
    >
      {children}
    </section>
  );
}

function Big({ value, of }: { value: string | number; of?: string }) {
  return (
    <div className="flex items-end gap-2">
      <span
        className="leading-none"
        style={{
          fontFamily: BIG,
          fontSize: 'clamp(48px, 5.2vw, 76px)',
          fontWeight: 500,
          letterSpacing: '-0.03em',
        }}
      >
        {value}
      </span>
      {of && (
        <span className="pb-2 text-[13px]" style={{ fontFamily: MONO, color: C.muted }}>
          / {of}
        </span>
      )}
    </div>
  );
}

function Ring({ done, target }: { done: number; target: number }) {
  const r = 70;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, done / Math.max(1, target));
  return (
    <svg viewBox="0 0 180 180" className="mx-auto w-full max-w-[200px]">
      <circle cx="90" cy="90" r={r} fill="none" stroke={C.track} strokeWidth="6" />
      <circle
        cx="90"
        cy="90"
        r={r}
        fill="none"
        stroke={C.blue}
        strokeWidth="6"
        strokeDasharray={`${circ * pct} ${circ}`}
        transform="rotate(-90 90 90)"
        strokeLinecap="butt"
      />
      <text
        x="90"
        y="92"
        textAnchor="middle"
        style={{ fontFamily: BIG, fontSize: 44, fill: C.ink, fontWeight: 500 }}
      >
        {done} / {target}
      </text>
      <text
        x="90"
        y="118"
        textAnchor="middle"
        style={{ fontFamily: MONO, fontSize: 10, fill: C.muted, letterSpacing: 1.5 }}
      >
        ON-BRAND POSTS
      </text>
    </svg>
  );
}

export interface DashFonts {
  mono: string;
  big: string;
  pass: string;
}

export default function BentoDashboard({
  data,
  isNew = false,
  fonts,
  initialTheme = 'dark',
}: {
  data: DashboardData;
  isNew?: boolean;
  fonts?: DashFonts;
  initialTheme?: DashTheme;
}) {
  const [theme, setTheme] = useState<DashTheme>(initialTheme);
  const maxScore = Math.max(...data.scoreHistory.map((p) => p.value), 1);
  const steps = STUDIO_STEPS;

  return (
    <main
      className="min-h-screen"
      style={
        {
          ...THEMES[theme],
          background: C.canvas,
          color: C.ink,
          transition: 'background 0.3s ease, color 0.3s ease',
          '--dash-mono': (fonts ?? DASH_FONTS).mono,
          '--dash-big': (fonts ?? DASH_FONTS).big,
          '--pass-type': (fonts ?? DASH_FONTS).pass,
        } as React.CSSProperties
      }
    >
      <div className="mx-auto max-w-[1360px] px-4 pb-10 pt-4 md:px-8">
        {/* Top bar + ticker strip */}
        <header
          className="flex items-center gap-6 overflow-x-auto border px-4 py-3"
          style={{ background: C.tile, borderColor: C.rule }}
        >
          <Link
            href="/world-preview/title"
            className="grid shrink-0 grid-cols-3 gap-[2px]"
            aria-label="Back to title screen"
          >
            {[1, 1, 1, 1, 1, 1, 1, 1, 1].map((_, i) => (
              <span key={i} className="h-[4px] w-[4px]" style={{ background: C.ink }} />
            ))}
          </Link>
          {[
            ['Followers', data.ticker.followers],
            ['7D change', data.ticker.change7d],
            ['Brand score', String(data.ticker.score)],
            ['Streak', data.ticker.streak],
            ['Avg fit', data.ticker.avgFit ? String(data.ticker.avgFit) : '—'],
          ].map(([k, v]) => (
            <div
              key={k}
              className="shrink-0 border-l pl-4"
              style={{ borderColor: C.rule, fontFamily: MONO }}
            >
              <div className="text-[9px] uppercase tracking-[0.14em]" style={{ color: C.muted }}>
                {k}
              </div>
              <div className="mt-[2px] text-[12px]">{v}</div>
            </div>
          ))}
          <div
            className="ml-auto flex shrink-0 items-center gap-2 pl-4"
            style={{ fontFamily: MONO }}
          >
            <button
              type="button"
              onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              className="mr-3 border px-2 py-1 text-[10px] uppercase tracking-[0.14em]"
              style={{ borderColor: C.rule, color: C.muted }}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? '◐ Light' : '◑ Dark'}
            </button>
            <span className="text-[11px] uppercase tracking-[0.1em]">@{data.handle}</span>
            <span className="h-7 w-7 overflow-hidden rounded-full" style={{ background: C.dim }}>
              {data.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- remote avatar
                <img src={data.avatarUrl} alt="" className="h-full w-full object-cover grayscale" />
              )}
            </span>
          </div>
        </header>

        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12">
          {/* Brand Pass (or its locked state for new users) */}
          <Tile className="md:col-span-5 md:row-span-2">
            <Label right={<span>{isNew ? 'Locked' : 'Share ↗'}</span>}>Brand Pass</Label>
            <div className="flex flex-1 items-center">
              {isNew ? (
                <div className="w-full py-10 text-center">
                  <div
                    className="mx-auto w-[70%] rounded-[10px] border border-dashed p-8"
                    style={{ borderColor: C.dim }}
                  >
                    <div
                      style={{ fontFamily: MONO, color: C.muted }}
                      className="text-[12px] uppercase tracking-[0.14em]"
                    >
                      Unlocks after your Taste Profile
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full">
                  <BrandPass data={data.pass} />
                </div>
              )}
            </div>
          </Tile>

          {/* Brand score + trend */}
          <Tile className="md:col-span-4" accent>
            <Label right={<span>6 scans</span>}>Brand score</Label>
            <div className="mt-6 grid grid-cols-[1fr_auto] items-end gap-4">
              <Big value={data.ticker.score} of="100" />
              <div className="flex h-[88px] items-end gap-[6px]" aria-label="Score history">
                {data.scoreHistory.map((p, i) => {
                  const last = i === data.scoreHistory.length - 1;
                  return (
                    <div key={p.label} className="flex flex-col items-center gap-1">
                      {last && (
                        <span className="text-[9px]" style={{ fontFamily: MONO, color: C.ink }}>
                          {p.value}
                        </span>
                      )}
                      <span
                        className="w-[14px]"
                        style={{
                          height: `${(p.value / maxScore) * 70}px`,
                          background: last ? C.ink : C.bar,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </Tile>

          {/* Posting streak */}
          <Tile className="md:col-span-3">
            <Label>This week</Label>
            <div className="mt-2 flex flex-1 items-center">
              {isNew ? (
                <div
                  className="w-full text-center text-[12px] uppercase tracking-[0.14em]"
                  style={{ fontFamily: MONO, color: C.muted }}
                >
                  Set your first goal in step 03
                </div>
              ) : (
                <Ring done={data.streak.done} target={data.streak.target} />
              )}
            </div>
          </Tile>

          {/* Onboarding (new) or Recent posts (active) */}
          {isNew ? (
            <div className="grid grid-cols-1 gap-3 md:col-span-7 md:grid-cols-3">
              {steps.map((st) => {
                const next = st.stage === data.stage + 1;
                const done = st.stage <= data.stage;
                return (
                  <Tile key={st.stage} accent={next} className="min-h-[200px]">
                    <div
                      className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.14em]"
                      style={{ fontFamily: MONO, color: next ? '#fff' : C.muted }}
                    >
                      <span className="shrink-0">Step 0{st.stage}</span>
                      <span>{done ? 'Built' : `Builds ${st.name}`}</span>
                    </div>
                    <div
                      className="mt-auto text-[28px] leading-[1.05]"
                      style={{
                        fontFamily: BIG,
                        fontWeight: 600,
                        letterSpacing: '-0.02em',
                        color: next ? '#fff' : done ? C.muted : C.ink,
                      }}
                    >
                      {st.verb}
                    </div>
                    <div
                      className="mt-2 text-[13px] leading-[1.4]"
                      style={{ color: next ? 'rgba(255,255,255,0.8)' : C.muted }}
                    >
                      {st.line}
                    </div>
                    {next && (
                      <div
                        className="mt-4 flex items-center justify-between text-[12px] uppercase tracking-[0.14em] text-white"
                        style={{ fontFamily: MONO }}
                      >
                        <span>Start here</span>
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[14px]"
                          style={{ color: C.blue }}
                        >
                          ↗
                        </span>
                      </div>
                    )}
                  </Tile>
                );
              })}
            </div>
          ) : (
            <Tile className="md:col-span-7">
              <Label right={<span>Fit / 100</span>}>Recent posts analyzed</Label>
              <ul className="mt-4">
                {data.posts.map((p, i) => {
                  const top = p.fit === Math.max(...data.posts.map((x) => x.fit));
                  return (
                    <li
                      key={p.id}
                      className="grid grid-cols-[1fr_auto] items-center gap-4 border-t py-3"
                      style={{ borderColor: C.rule }}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-[14px]">{p.excerpt}</div>
                        <div
                          className="mt-1 text-[10px] uppercase tracking-[0.12em]"
                          style={{ fontFamily: MONO, color: C.muted }}
                        >
                          {p.when} · {p.likes} likes · {p.multiple} usual
                        </div>
                        <div className="mt-2 h-[3px] w-full" style={{ background: C.track }}>
                          <div
                            className="h-full"
                            style={{ width: `${p.fit}%`, background: top ? C.blue : C.bar }}
                          />
                        </div>
                      </div>
                      <span
                        className="w-[64px] text-right text-[30px] leading-none"
                        style={{ fontFamily: BIG, fontWeight: 500, color: top ? C.blue : C.ink }}
                      >
                        {p.fit}
                      </span>
                      {i === 0 && <span className="sr-only">Most recent</span>}
                    </li>
                  );
                })}
              </ul>
            </Tile>
          )}
        </div>
      </div>
    </main>
  );
}
