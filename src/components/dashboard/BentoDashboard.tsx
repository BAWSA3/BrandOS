'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { haptic } from '@/lib/haptics';
import { playSound, primeSounds } from '@/lib/ui-sounds';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Ticker } from 'motion-plus/react';
import {
  CornerBrackets,
  DashCursor,
  RollNumber,
  ScrambleLabel,
  TileHoverCtx,
  useBoot,
  useFinePointer,
  useTileHover,
} from '@/components/dashboard/dashMotion';
import BrandPass, { type BrandPassData } from '@/components/dashboard/BrandPass';
import { DASH_FONTS } from '@/components/dashboard/dashFonts';
import {
  BrandScoreTile,
  WeekTile,
  type PhaseScore,
  type WeekDay,
} from '@/components/dashboard/StatTiles';
import XPBar from '@/components/dashboard/XPBar';
import ScoreDetail, { type ScoreDetailPoint } from '@/components/dashboard/ScoreDetail';
import RescanOverlay from '@/components/dashboard/RescanOverlay';
import ScanReport from '@/components/dashboard/ScanReport';
import PostRow from '@/components/dashboard/PostRow';
import PassShare from '@/components/dashboard/PassShare';
import StationTile from '@/components/dashboard/StationTile';
import { stationSlug } from '@/components/StationCard';
import type { XPGain } from '@/lib/xp';
import type { PostBreakdownData } from '@/lib/post-scores';
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
    '--d-canvas': '#F2EFE8', // warm bone
    '--d-tile': '#FAF8F3',
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

// True once the dashboard has booted: cue for numbers to roll and labels to decode.
const BootCtx = createContext(false);

export interface RecentPost {
  id: string;
  excerpt: string;
  when: string;
  fit: number;
  likes: number;
  multiple: string; // "2.0x"
  /** Why it scored that way + what to sharpen (the row's dropdown). */
  breakdown?: PostBreakdownData;
  /** Link to the post on X. */
  url?: string;
}

export interface DashboardData {
  handle: string;
  avatarUrl?: string | null;
  stage: StageNumber;
  /** Stats with no real source yet are left out and hidden from the ticker. */
  ticker: {
    followers?: string;
    change7d?: string;
    score: number;
    streak?: string;
    avgFit?: number;
    scans?: number;
  };
  scoreHistory: { label: string; value: number }[];
  streak?: { done: number; target: number };
  /** Analysed posts with fit scores; when empty, the tile lists recent scans instead. */
  posts: RecentPost[];
  /** Per-scan detail for the brand score drill-down (oldest first). */
  scoreDetail?: ScoreDetailPoint[];
  scans?: { id: string; label: string; score: number; delta?: number }[];
  pass: BrandPassData;
  scoreDelta?: { value: number; since: string };
  phases?: PhaseScore[];
  week?: { range: string; days: WeekDay[]; streakWeeks?: number };
}

function Label({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  const booted = useContext(BootCtx);
  return (
    <div
      className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em]"
      style={{ fontFamily: MONO, color: C.muted }}
    >
      <span>
        {typeof children === 'string' ? (
          <ScrambleLabel booted={booted}>{children}</ScrambleLabel>
        ) : (
          children
        )}
      </span>
      {right}
    </div>
  );
}

/** A tile's mono label on its own (for tiles that lay out their own header row). */
function TileLabel({ children }: { children: string }) {
  const booted = useContext(BootCtx);
  return (
    <span
      className="text-[11px] uppercase tracking-[0.14em]"
      style={{ fontFamily: MONO, color: C.muted }}
    >
      <ScrambleLabel booted={booted}>{children}</ScrambleLabel>
    </span>
  );
}

function Tile({
  children,
  className = '',
  accent = false,
  open = false,
  onOpen,
  layoutId,
}: {
  children: React.ReactNode;
  className?: string;
  accent?: boolean;
  /** Shows the cursor's "OPEN ↗" label over this tile (desktop). */
  open?: boolean;
  /** Makes the tile a button that opens its detail view (shared layoutId expand). */
  onOpen?: () => void;
  layoutId?: string;
}) {
  // A Klein-blue tile flips the theme's ink to white so labels and numbers read on it.
  const onBlue = accent
    ? {
        '--d-ink': '#FFFFFF',
        '--d-muted': 'rgba(255,255,255,0.72)',
        '--d-bar': 'rgba(255,255,255,0.38)',
      }
    : {};
  // Each cursor entry bumps the counter: children replay a small one-shot animation.
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const [hv, setHv] = useState(0);
  const [inside, setInside] = useState(false);
  // Touch has no hover: a press locks the brackets on and presses the tile in.
  const [pressed, setPressed] = useState(false);
  const live = fine && !reduce;
  const release = () => setPressed(false);
  return (
    <motion.section
      layoutId={reduce ? undefined : layoutId}
      transition={{ type: 'spring', duration: 0.45, bounce: 0 }}
      animate={{ scale: pressed && open && !reduce ? 0.985 : 1 }}
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      aria-haspopup={onOpen ? 'dialog' : undefined}
      onClick={(e) => {
        if (!onOpen || (e.target as HTMLElement).closest('a')) return;
        onOpen();
      }}
      onKeyDown={(e) => {
        if (!onOpen || e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      data-cursor-zone={open ? 'open' : undefined}
      data-surface={accent ? 'blue' : undefined}
      onMouseEnter={() => {
        if (!live) return;
        setInside(true);
        setHv((n) => n + 1);
      }}
      onMouseLeave={() => setInside(false)}
      onPointerDown={(e) => {
        if (e.pointerType === 'mouse') return;
        setPressed(true);
        if (!reduce) setHv((n) => n + 1);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
      className={`relative flex flex-col p-5 ${className}`}
      style={
        {
          ...onBlue,
          cursor: onOpen ? 'pointer' : undefined,
          background: accent ? C.blue : C.tile,
          border: `1px solid ${accent ? C.blue : C.rule}`,
          color: C.ink,
        } as React.CSSProperties
      }
    >
      <TileHoverCtx.Provider value={hv}>{children}</TileHoverCtx.Provider>
      <CornerBrackets active={inside || pressed} color={accent ? '#FFFFFF' : C.blue} />
    </motion.section>
  );
}

/** A post's fit bar; refills left to right each time its panel is entered. */
function FitBar({ fit, top, i }: { fit: number; top: boolean; i: number }) {
  const hv = useTileHover();
  return (
    <motion.div
      key={hv}
      className="h-full"
      style={{ background: top ? C.blue : C.bar }}
      initial={{ width: hv > 0 ? 0 : `${fit}%` }}
      animate={{ width: `${fit}%` }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: hv > 0 ? i * 0.06 : 0 }}
    />
  );
}

/** Parse "4,812" / "+2.4%" into a rolling number; anything else stays text. */
function StatValue({ text }: { text: string }) {
  const booted = useContext(BootCtx);
  const m = text.match(/^([+-]?)([\d,]+(?:\.\d+)?)(%?)$/);
  if (!m) return <>{text}</>;
  const value = Number(m[2].replace(/,/g, ''));
  const decimals = m[2].includes('.') ? m[2].split('.')[1].length : 0;
  return (
    <RollNumber
      value={value}
      booted={booted}
      prefix={m[1] || undefined}
      suffix={m[3] || undefined}
      decimals={decimals}
      grouping={m[2].includes(',')}
    />
  );
}

/** The top stat strip as a slow market-style ticker; pauses on hover. */
function StatTicker({ data }: { data: DashboardData }) {
  const reduce = useReducedMotion();
  const stats = (
    [
      ['Followers', data.ticker.followers],
      ['7D change', data.ticker.change7d],
      ['Brand score', String(data.ticker.score)],
      ['Streak', data.ticker.streak],
      ['Avg fit', data.ticker.avgFit ? String(data.ticker.avgFit) : undefined],
      ['Scans', data.ticker.scans ? String(data.ticker.scans) : undefined],
    ] as [string, string | undefined][]
  ).filter((s): s is [string, string] => !!s[1]);
  const items = stats.map(([k, v]) => (
    <div
      key={k}
      className="shrink-0 border-l px-4"
      style={{ borderColor: C.rule, fontFamily: MONO }}
    >
      <div className="text-[9px] uppercase tracking-[0.14em]" style={{ color: C.muted }}>
        {k}
      </div>
      <div className="mt-[2px] text-[12px]">
        <StatValue text={v} />
      </div>
    </div>
  ));
  return (
    <div
      className="order-last w-full min-w-0 border-t pt-3 md:order-none md:w-auto md:flex-1 md:border-t-0 md:pt-0"
      style={{ borderColor: C.rule }}
    >
      <Ticker items={items} velocity={18} hoverFactor={0} fade={40} isStatic={!!reduce} />
    </div>
  );
}

export interface DashFonts {
  mono: string;
  big: string;
  pass: string;
}

/** Top offset that clears fixed/sticky banners pinned to the top edge (staging, beta bars). */
function belowTopBanners(gap = 12): number {
  let bottom = 0;
  for (const el of Array.from(document.body.querySelectorAll<HTMLElement>('body *'))) {
    const pos = getComputedStyle(el).position;
    if (pos !== 'fixed' && pos !== 'sticky') continue;
    const r = el.getBoundingClientRect();
    // a bar across the top: starts at the edge, wide, not too tall
    if (r.top <= 1 && r.height > 0 && r.height < 120 && r.width > window.innerWidth * 0.6)
      bottom = Math.max(bottom, r.bottom);
  }
  return bottom + gap;
}

export default function BentoDashboard({
  data,
  isNew = false,
  fonts,
  initialTheme = 'light',
  scoreAlert,
  xp,
  rescan,
  homeHref = '/world-preview/title',
  swapPassStation = true,
}: {
  data: DashboardData;
  isNew?: boolean;
  fonts?: DashFonts;
  initialTheme?: DashTheme;
  /** The brand score changed since the last visit: show the notification + sound. */
  scoreAlert?: { delta: number; score: number } | null;
  /** Show the Rescan button: 'live' scans for real (/api/dashboard/rescan), 'demo' simulates it. */
  rescan?: 'live' | 'demo';
  /** Where the top-left grid goes: the main menu (/home) on the real dashboard. */
  homeHref?: string;
  /** Layout (picked 2026-10-13): the station takes the big left tile, the Brand Pass the small right one. */
  swapPassStation?: boolean;
  /** XP total and what was earned since the last visit (the bar fills it in). */
  xp?: { total: number; gains: XPGain[] } | null;
}) {
  const [theme, setTheme] = useState<DashTheme>(initialTheme);
  // which tile's detail view is open (drill-downs)
  const [detail, setDetail] = useState<'score' | null>(null);
  const [detailPhase, setDetailPhase] = useState<string | null>(null);
  // scan report: index into data.scoreDetail (oldest first)
  const [report, setReport] = useState<number | null>(null);
  const openReport = (id: string) => {
    const i = data.scoreDetail?.findIndex((p) => p.id === id) ?? -1;
    if (i < 0) return;
    setDetail(null);
    setReport(i);
  };

  // Rescan: overlay while it runs, then the score rolls and the alert fires
  const router = useRouter();
  const [scan, setScan] = useState<{ status: 'running' | 'done' | 'error'; error?: string } | null>(
    null
  );
  const [scoreNow, setScoreNow] = useState<number | null>(null);
  const [rescanAlert, setRescanAlert] = useState<{ delta: number; score: number } | null>(null);
  const runRescan = async () => {
    if (scan?.status === 'running') return;
    setScan({ status: 'running' });
    const before = scoreNow ?? data.ticker.score;
    try {
      let next: number;
      if (rescan === 'demo') {
        await new Promise((r) => window.setTimeout(r, 9000));
        next = Math.min(100, before + 3);
      } else {
        const res = await fetch('/api/dashboard/rescan', { method: 'POST' });
        const body = await res.json().catch(() => ({}));
        if (!res.ok || typeof body.score !== 'number') {
          setScan({
            status: 'error',
            error:
              res.status === 429 && !body.error
                ? 'Too many scans right now. Try again in a minute.'
                : body.error,
          });
          return;
        }
        next = body.score;
      }
      setScan({ status: 'done' });
      await new Promise((r) => window.setTimeout(r, 700));
      setScan(null);
      setScoreNow(next);
      setRescanAlert({ delta: next - before, score: next });
      if (rescan === 'live') router.refresh();
    } catch {
      setScan({ status: 'error', error: 'Scan failed. Check your connection and try again.' });
    }
  };
  const alert = rescanAlert ?? scoreAlert;

  // Recent posts: one breakdown open at a time; "Analyze my latest posts"
  const [openPost, setOpenPost] = useState<string | null>(null);
  const [postRun, setPostRun] = useState<{ busy: boolean; note?: string }>({ busy: false });
  const analyzePosts = async () => {
    if (postRun.busy) return;
    setPostRun({ busy: true });
    try {
      if (rescan === 'demo') {
        await new Promise((r) => window.setTimeout(r, 2000));
        setPostRun({ busy: false, note: 'Preview: nothing new to score' });
        return;
      }
      const res = await fetch('/api/dashboard/post-scores', { method: 'POST' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPostRun({ busy: false, note: body.error ?? 'Could not analyze right now' });
        return;
      }
      setPostRun({
        busy: false,
        note: body.scored
          ? `${body.scored} new post${body.scored > 1 ? 's' : ''} scored`
          : 'No new posts since last time',
      });
      if (body.scored) router.refresh();
    } catch {
      setPostRun({ busy: false, note: 'Could not analyze right now' });
    }
  };
  const analyzeButton = rescan ? (
    <button
      type="button"
      onClick={analyzePosts}
      disabled={postRun.busy}
      className="uppercase hover:underline disabled:opacity-60"
      style={{ color: C.blue }}
    >
      {postRun.busy ? 'Analyzing…' : (postRun.note ?? '↻ Analyze new posts')}
    </button>
  ) : (
    <span>Fit / 100</span>
  );
  // Station tile sits beside the score; the week tile then drops to row 2 next to posts.
  const hasStation = !isNew && !!stationSlug(data.pass.archetype);
  const listSpan = hasStation && data.week ? 'md:col-span-4' : 'md:col-span-7';
  // Brand Pass and station tiles, placed by layout (station big when swapPassStation).
  const swap = swapPassStation && hasStation;
  const passTile = (cls: string, compact = false) => (
    <Tile className={cls}>
      <Label right={isNew ? <span>Locked</span> : <PassShare pass={data.pass} />}>Brand Pass</Label>
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
            <BrandPass
              data={data.pass}
              typeTaste={booted}
              compact={compact}
              selfHeal={rescan === 'live'}
            />
          </div>
        )}
      </div>
    </Tile>
  );
  const stationTile = (cls: string, large = false) => (
    <Tile className={cls} open>
      <StationTile
        archetype={data.pass.archetype}
        handle={data.handle}
        stationNumber={data.pass.stationNumber}
        mode={theme === 'dark' ? 'night' : 'day'}
        large={large}
      />
    </Tile>
  );
  const openScore = (phase: string | null = null) => {
    setDetailPhase(phase);
    setDetail('score');
  };
  const booted = useBoot();

  // Sounds: unlock/preload on the first gesture; one short beep per button/link hovered.
  useEffect(() => primeSounds(), []);
  const lastHover = useRef<Element | null>(null);
  const onPointerOver = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    const el = (e.target as HTMLElement).closest('a, button');
    if (!el || el.getAttribute('data-cursor') === 'default') {
      lastHover.current = null;
      return;
    }
    if (el === lastHover.current) return;
    lastHover.current = el;
    playSound('hover');
  };

  // Score alert: slides in after the dashboard boots, with the alert sound.
  const [alertOn, setAlertOn] = useState(false);
  const [alertTop, setAlertTop] = useState(16);
  useEffect(() => {
    if (!alert?.delta) return;
    const a = window.setTimeout(
      () => {
        setAlertTop(belowTopBanners());
        setAlertOn(true);
        playSound('alert');
        haptic('alert');
      },
      rescanAlert ? 300 : 1600
    );
    const b = window.setTimeout(() => setAlertOn(false), 6800);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- replay only when the alert changes
  }, [alert?.delta, alert?.score]);
  const steps = STUDIO_STEPS;

  return (
    <main
      className="min-h-screen"
      onPointerOver={onPointerOver}
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse' && (e.target as HTMLElement).closest('a, button'))
          haptic('tap');
      }}
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
      <BootCtx.Provider value={booted}>
        {alert && alert.delta !== 0 && (
          <button
            type="button"
            role="status"
            onClick={() => setAlertOn(false)}
            className="fixed right-4 z-[60] flex max-w-[calc(100vw-2rem)] items-center gap-3 px-4 py-3 text-left text-white shadow-[0_12px_32px_rgba(0,0,0,0.25)]"
            style={{
              fontFamily: MONO,
              top: alertTop,
              background: C.blue,
              opacity: alertOn ? 1 : 0,
              transform: alertOn ? 'translateY(0)' : 'translateY(-12px)',
              pointerEvents: alertOn ? 'auto' : 'none',
              transition: 'opacity 0.35s ease, transform 0.45s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <span className="text-[18px] leading-none">{alert.delta > 0 ? '▲' : '▼'}</span>
            <span className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.14em] opacity-80">
                Brand score changed
              </span>
              <span className="mt-1 text-[13px] uppercase tracking-[0.1em]">
                {alert.delta > 0 ? '+' : '−'}
                {Math.abs(alert.delta)} · now {alert.score}
              </span>
            </span>
          </button>
        )}
        <DashCursor />
        <div className="mx-auto max-w-[1360px] px-4 pb-10 pt-4 md:px-8">
          {/* Top bar + ticker strip */}
          <header
            className="flex flex-wrap items-center gap-x-6 gap-y-3 border px-4 py-3 md:flex-nowrap"
            style={{ background: C.tile, borderColor: C.rule }}
          >
            <Link
              href={homeHref}
              className="grid shrink-0 grid-cols-3 gap-[2px]"
              aria-label="Back to title screen"
            >
              {[1, 1, 1, 1, 1, 1, 1, 1, 1].map((_, i) => (
                <span key={i} className="h-[4px] w-[4px]" style={{ background: C.ink }} />
              ))}
            </Link>
            <StatTicker data={data} />
            <div
              className="ml-auto flex shrink-0 items-center gap-2 pl-4"
              style={{ fontFamily: MONO }}
            >
              {rescan && (
                <button
                  type="button"
                  onClick={runRescan}
                  disabled={scan?.status === 'running'}
                  className="mr-1 border px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-white disabled:opacity-60"
                  style={{ background: C.blue, borderColor: C.blue }}
                  aria-label="Rescan my brand"
                >
                  ↻ Rescan
                </button>
              )}
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
                  <img
                    src={data.avatarUrl}
                    alt=""
                    className="h-full w-full object-cover grayscale"
                  />
                )}
              </span>
            </div>
          </header>

          {xp && <XPBar total={xp.total} gains={xp.gains} booted={booted} />}

          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-12">
            {swap
              ? stationTile('md:col-span-5 md:row-span-2', true)
              : passTile('md:col-span-5 md:row-span-2')}

            {/* Brand score: hero number, delta, trend, phase meters */}
            <Tile
              className={data.week || isNew || hasStation ? 'md:col-span-4' : 'md:col-span-7'}
              accent
              open
              layoutId="tile-score"
              onOpen={data.scoreDetail?.length ? () => openScore() : undefined}
            >
              <BrandScoreTile
                score={scoreNow ?? data.ticker.score}
                history={data.scoreHistory}
                delta={data.scoreDelta}
                phases={data.phases}
                booted={booted}
                label={<TileLabel>Brand score</TileLabel>}
                onPhase={data.scoreDetail?.length ? (key) => openScore(key) : undefined}
              />
            </Tile>

            {/* Your station (or, swapped, the Brand Pass) on the right */}
            {swap ? passTile('md:col-span-3', true) : hasStation && stationTile('md:col-span-3')}

            {/* This week: goal meter + day strip (hidden until weekly data exists) */}
            {(isNew || data.week) && (
              <Tile className="md:col-span-3">
                {isNew || !data.week ? (
                  <>
                    <Label>This week</Label>
                    <div
                      className="flex flex-1 items-center justify-center text-center text-[12px] uppercase tracking-[0.14em]"
                      style={{ fontFamily: MONO, color: C.muted }}
                    >
                      Set your first goal in step 03
                    </div>
                  </>
                ) : (
                  <WeekTile
                    range={data.week.range}
                    days={data.week.days}
                    done={data.streak?.done ?? 0}
                    target={data.streak?.target ?? 3}
                    streakWeeks={data.week.streakWeeks}
                    booted={booted}
                    label={<TileLabel>This week</TileLabel>}
                  />
                )}
              </Tile>
            )}

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
            ) : data.posts.length === 0 ? (
              <Tile className={listSpan}>
                <Label right={<span>Score / 100</span>}>Recent scans</Label>
                {rescan && (
                  <div
                    className="mt-3 flex w-full items-center justify-between gap-3 border px-3 py-2.5"
                    style={{ borderColor: C.rule }}
                  >
                    <span className="text-[13px]">
                      {postRun.busy
                        ? 'Reading your latest posts…'
                        : (postRun.note ?? 'See how your latest posts score for your brand')}
                    </span>
                    <button
                      type="button"
                      onClick={analyzePosts}
                      disabled={postRun.busy}
                      className="shrink-0 px-1 py-0.5 text-[10px] uppercase tracking-[0.14em] hover:underline disabled:opacity-60"
                      style={{ fontFamily: MONO, color: C.blue }}
                    >
                      {postRun.busy ? '…' : 'Analyze ↗'}
                    </button>
                  </div>
                )}
                <ul className="mt-4">
                  {(data.scans ?? []).map((sc, i) => (
                    <li key={sc.id} className="border-t" style={{ borderColor: C.rule }}>
                      <button
                        type="button"
                        onClick={() => openReport(sc.id)}
                        disabled={!data.scoreDetail?.some((p) => p.id === sc.id)}
                        aria-label={`Open the full report for the ${sc.label} scan`}
                        className="group grid w-full grid-cols-[1fr_auto] items-center gap-4 py-3 text-left"
                      >
                        <div className="min-w-0">
                          <div className="text-[14px]">
                            {sc.label}
                            <span
                              className="ml-2 text-[10px] uppercase tracking-[0.14em] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
                              style={{ fontFamily: MONO, color: C.blue }}
                            >
                              Full report ↗
                            </span>
                          </div>
                          <div
                            className="mt-1 text-[10px] uppercase tracking-[0.12em]"
                            style={{ fontFamily: MONO, color: C.muted }}
                          >
                            {sc.delta === undefined
                              ? 'First scan'
                              : sc.delta === 0
                                ? 'No change'
                                : `${sc.delta > 0 ? '▲' : '▼'} ${Math.abs(sc.delta)} vs previous`}
                          </div>
                          <div className="mt-2 h-[3px] w-full" style={{ background: C.track }}>
                            <FitBar fit={sc.score} top={i === 0} i={i} />
                          </div>
                        </div>
                        <span
                          className="w-[64px] text-right text-[30px] leading-none"
                          style={{
                            fontFamily: BIG,
                            fontWeight: 500,
                            color: i === 0 ? C.blue : C.ink,
                          }}
                        >
                          <RollNumber value={sc.score} booted={booted} delay={0.25 + i * 0.12} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </Tile>
            ) : (
              <Tile className={listSpan}>
                <Label right={analyzeButton}>Recent posts analyzed</Label>
                <ul className="mt-4">
                  {data.posts.map((p, i) => {
                    const top = p.fit === Math.max(...data.posts.map((x) => x.fit));
                    return (
                      <PostRow
                        key={p.id}
                        post={p}
                        top={top}
                        open={openPost === p.id}
                        onToggle={() => setOpenPost((o) => (o === p.id ? null : p.id))}
                        bar={<FitBar fit={p.fit} top={top} i={i} />}
                        figure={
                          <RollNumber value={p.fit} booted={booted} delay={0.25 + i * 0.12} />
                        }
                      />
                    );
                  })}
                </ul>
              </Tile>
            )}
          </div>
        </div>
        <AnimatePresence>
          {report !== null && !!data.scoreDetail?.length && (
            <ScanReport
              key="report"
              points={data.scoreDetail}
              index={report}
              handle={data.handle}
              onIndex={setReport}
              onClose={() => setReport(null)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {scan && (
            <RescanOverlay
              key="rescan"
              handle={data.handle}
              status={scan.status}
              error={scan.error}
              onClose={() => setScan(null)}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {detail === 'score' && !!data.scoreDetail?.length && (
            <ScoreDetail
              key="score"
              points={data.scoreDetail}
              layoutId="tile-score"
              initialPhase={detailPhase}
              onClose={() => setDetail(null)}
              onReport={openReport}
            />
          )}
        </AnimatePresence>
      </BootCtx.Provider>
    </main>
  );
}
