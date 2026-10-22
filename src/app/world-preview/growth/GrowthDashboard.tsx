'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimateNumber } from 'motion-plus/react';
import { useReducedMotion } from 'motion/react';
import Wordmark from '@/components/Wordmark';

/**
 * Layout preview (decided 2026-10-22): the dashboard is about growing and
 * scaling a brand — no stations. Growth, post performance, competitors,
 * audience and an idea board, with a brand switcher for SMMs and agencies.
 * Sample data; competitor numbers are real reads from Oct 22.
 *
 * Motion+: one headline moment — the score rolls up in the Klein tile
 * (AnimateNumber). Everything else is still. Reduced motion shows the value.
 */

const BIG = "'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif";
const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";
const T = {
  canvas: '#F2EFE8',
  tile: '#FAF8F3',
  ink: '#0E0E0E',
  muted: '#6B6862',
  rule: 'rgba(14,14,14,0.10)',
  track: 'rgba(14,14,14,0.08)',
  blue: '#0047FF',
};

type Brand = { handle: string; kind: 'Creator' | 'Brand'; note?: string };
const BRANDS: Brand[] = [
  { handle: 'jbawsa', kind: 'Creator', note: 'you' },
  { handle: 'mybrandos', kind: 'Brand' },
  { handle: 'acmelabs', kind: 'Brand', note: 'client' },
];

// 30 days of followers (sample) — tracking starts the day a brand is added
const FOLLOWERS = Array.from({ length: 30 }, (_, i) =>
  Math.round(30_950 + i * 21 + Math.sin(i / 2.3) * 40 + (i > 22 ? (i - 22) * 38 : 0))
);

const FORMATS = [
  { label: 'With media', er: 2.9, share: 43 },
  { label: 'Threads', er: 3.4, share: 2 },
  { label: 'Quote posts', er: 2.2, share: 24 },
  { label: 'Text only', er: 1.4, share: 31 },
];

const TOP_POSTS = [
  {
    text: 'the 3 income streams nobody tells you about when you start posting…',
    er: 4.8,
    why: 'Monetization + a numbered promise. Your best-performing pillar.',
  },
  {
    text: 'stop asking for followers. ask for one reply from the right person.',
    er: 3.9,
    why: 'Contrarian one-liner, posted at your peak hour (15:00 UTC).',
  },
];
const LOW_POST = {
  text: 'gm. building today 🔨',
  er: 0.4,
  why: 'No idea in it. Posts like this are 22% of your feed and drag the average.',
};

const COMPETITORS = [
  { handle: 'jbawsa', you: true, score: 72, er: 2.6, perDay: 3.1, growth: 1.9 },
  { handle: '0xhvdes', score: 78, er: 2.05, perDay: 1.9, growth: 1.1 },
  { handle: 'galileowilson', score: 72, er: 5.5, perDay: 6.6, growth: 2.4 },
  { handle: 'carlitoswa_y', score: 68, er: 4.1, perDay: 10.7, growth: 0.8 },
];

const ENGAGERS = [
  { handle: 'galileowilson', replies: 9, reposts: 2 },
  { handle: 'kreatorsdao', replies: 7, reposts: 4 },
  { handle: 'notthreadguy', replies: 5, reposts: 0 },
  { handle: 'mintlabs', replies: 3, reposts: 5 },
];

type Idea = { id: number; text: string; why?: string; col: 'ideas' | 'drafting' | 'posted' };
const IDEAS: Idea[] = [
  {
    id: 1,
    col: 'ideas',
    text: 'Thread: "how I priced my first brand deal" (5 posts)',
    why: 'Threads earn 2.4× your average and you posted 1 this month.',
  },
  {
    id: 2,
    col: 'ideas',
    text: 'Screenshot your BrandOS score jump and explain the one change',
    why: 'Posts with media earn 2.1× text-only.',
  },
  {
    id: 3,
    col: 'ideas',
    text: 'Reply-guy audit: 3 replies that grew my account',
    why: '@0xhvdes gets 38 replies a post; you get 21.',
  },
  { id: 4, col: 'drafting', text: 'Why I stopped posting "gm"' },
  { id: 5, col: 'posted', text: 'The 3 income streams nobody tells you about' },
];

// prompts for a blank page: things only this person can say
const SPARKS = [
  'Something I changed my mind about',
  'A question my audience keeps asking',
  'A win (or a miss) from this week',
  'What everyone in my niche gets wrong',
];

function Label({ children, color = T.muted }: { children: React.ReactNode; color?: string }) {
  return (
    <div className="text-[10px] uppercase tracking-[0.16em]" style={{ fontFamily: MONO, color }}>
      {children}
    </div>
  );
}

function Tile({
  children,
  className = '',
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <section
      className={`border p-5 md:p-7 ${className}`}
      style={{ background: T.tile, borderColor: T.rule, ...style }}
    >
      {children}
    </section>
  );
}

/** 30-day followers line: one series, 2px, recessive axis, hover readout. */
function FollowersChart() {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 150;
  const min = Math.min(...FOLLOWERS) - 40;
  const max = Math.max(...FOLLOWERS) + 40;
  const x = (i: number) => (i / (FOLLOWERS.length - 1)) * W;
  const y = (v: number) => H - ((v - min) / (max - min)) * H;
  const d = FOLLOWERS.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(
    ''
  );
  const i = hover ?? FOLLOWERS.length - 1;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <Label>Followers</Label>
        <span className="text-[11px]" style={{ fontFamily: MONO, color: T.ink }}>
          {FOLLOWERS[i].toLocaleString()}
          <span style={{ color: T.muted }}>
            {' '}
            · {i === FOLLOWERS.length - 1 ? 'today' : `day ${i + 1}`}
          </span>
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H + 18}`}
        className="block w-full"
        role="img"
        aria-label={`Followers over 30 days, from ${FOLLOWERS[0].toLocaleString()} to ${FOLLOWERS.at(-1)!.toLocaleString()}`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const k = Math.round(((e.clientX - r.left) / r.width) * (FOLLOWERS.length - 1));
          setHover(Math.max(0, Math.min(FOLLOWERS.length - 1, k)));
        }}
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke={T.track} strokeWidth={1} />
        ))}
        <path d={d} fill="none" stroke={T.blue} strokeWidth={2} strokeLinejoin="round" />
        <line x1={x(i)} x2={x(i)} y1={0} y2={H} stroke={T.rule} strokeWidth={1} />
        <circle
          cx={x(i)}
          cy={y(FOLLOWERS[i])}
          r={4}
          fill={T.blue}
          stroke={T.tile}
          strokeWidth={2}
        />
        <text x={0} y={H + 15} fontSize={10} fill={T.muted} style={{ fontFamily: MONO }}>
          30D AGO
        </text>
        <text
          x={W}
          y={H + 15}
          fontSize={10}
          fill={T.muted}
          textAnchor="end"
          style={{ fontFamily: MONO }}
        >
          TODAY
        </text>
      </svg>
    </div>
  );
}

function Bar({ value, max, accent = false }: { value: number; max: number; accent?: boolean }) {
  return (
    <div className="h-[6px] w-full" style={{ background: T.track }}>
      <div
        className="h-full"
        style={{
          width: `${Math.max(2, (value / max) * 100)}%`,
          background: accent ? T.blue : T.ink,
          borderRadius: '0 4px 4px 0',
        }}
      />
    </div>
  );
}

export default function GrowthDashboard() {
  const reduce = useReducedMotion();
  const [brand, setBrand] = useState<Brand>(BRANDS[0]);
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(0);
  const [ideas, setIdeas] = useState<Idea[]>(IDEAS);
  const [draft, setDraft] = useState('');
  const pageRef = useRef<HTMLTextAreaElement>(null);
  // the page grows with the idea instead of scrolling inside a box
  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(120, el.scrollHeight)}px`;
  }, [draft]);
  const pin = () => {
    if (!draft.trim()) return;
    setIdeas((all) => [{ id: Date.now(), text: draft.trim(), col: 'ideas' }, ...all]);
    setDraft('');
  };

  // AnimateNumber only rolls when the value changes after mount
  useEffect(() => {
    const t = window.setTimeout(() => setScore(72), reduce ? 0 : 250);
    return () => window.clearTimeout(t);
  }, [reduce]);

  const followersNow = FOLLOWERS.at(-1)!;
  const followers7 = followersNow - FOLLOWERS[FOLLOWERS.length - 8];
  const maxEr = useMemo(() => Math.max(...FORMATS.map((f) => f.er)), []);
  const maxCompEr = Math.max(...COMPETITORS.map((c) => c.er));

  const move = (id: number, col: Idea['col']) =>
    setIdeas((all) => all.map((i) => (i.id === id ? { ...i, col } : i)));

  return (
    <main className="min-h-screen pb-24" style={{ background: T.canvas, color: T.ink }}>
      {/* Top bar: brand switcher is the first thing an SMM touches */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b px-4 py-3 md:px-8"
        style={{ background: T.canvas, borderColor: T.rule }}
      >
        <div className="flex items-center gap-4">
          <Wordmark height={20} />
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 whitespace-nowrap border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em]"
              style={{ fontFamily: MONO, borderColor: T.rule, background: T.tile }}
              aria-expanded={open}
            >
              @{brand.handle}
              <span className="hidden sm:inline" style={{ color: T.muted }}>
                · {brand.kind}
              </span>
              <span aria-hidden>▾</span>
            </button>
            {open && (
              <div
                className="absolute left-0 top-full z-30 mt-1 w-[240px] border"
                style={{ background: T.tile, borderColor: T.rule }}
              >
                <div className="px-3 pb-1 pt-3">
                  <Label>Your brands · 3 of 5</Label>
                </div>
                {BRANDS.map((b) => (
                  <button
                    key={b.handle}
                    type="button"
                    onClick={() => {
                      setBrand(b);
                      setOpen(false);
                    }}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-[14px] hover:bg-black/[0.04]"
                  >
                    <span>
                      @{b.handle}
                      {b.note && (
                        <span className="ml-1.5 text-[12px]" style={{ color: T.muted }}>
                          {b.note}
                        </span>
                      )}
                    </span>
                    <span
                      className="text-[9px] uppercase tracking-[0.14em]"
                      style={{ fontFamily: MONO, color: T.muted }}
                    >
                      {b.kind}
                    </span>
                  </button>
                ))}
                <button
                  type="button"
                  className="w-full border-t px-3 py-2.5 text-left text-[11px] uppercase tracking-[0.14em]"
                  style={{ fontFamily: MONO, borderColor: T.rule, color: T.blue }}
                >
                  + Add a brand
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="hidden border px-2 py-1 text-[10px] uppercase tracking-[0.14em] sm:inline"
            style={{ fontFamily: MONO, background: T.blue, borderColor: T.blue, color: '#fff' }}
          >
            Team · free until Dec 3
          </span>
          <span
            className="border px-2 py-1 text-[10px] uppercase tracking-[0.14em]"
            style={{ fontFamily: MONO, borderColor: T.rule, color: T.muted }}
          >
            Settings
          </span>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1240px] px-4 md:px-8">
        {/* Masthead */}
        <div className="pb-8 pt-10 md:pt-14">
          <Label>
            {brand.kind} · SOURCE · {followersNow.toLocaleString()} followers · tracked 30 days
          </Label>
          <h1
            className="mt-3 break-all text-[52px] leading-[0.9] md:text-[104px]"
            style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.05em' }}
          >
            @{brand.handle}
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
          {/* Score: the one Klein moment */}
          <section className="p-6 text-white md:col-span-5 md:p-8" style={{ background: T.blue }}>
            <div className="flex items-center justify-between">
              <Label color="rgba(255,255,255,0.75)">Brand score</Label>
              <span
                className="border border-white/60 px-2 py-[3px] text-[10px] uppercase tracking-[0.14em]"
                style={{ fontFamily: MONO }}
              >
                ▲ 4 this week
              </span>
            </div>
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
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4">
              {[
                ['Define', 78],
                ['Check', 71],
                ['Generate', 68],
                ['Scale', 69],
              ].map(([k, v]) => (
                <div key={k as string}>
                  <div
                    className="flex justify-between text-[10px] uppercase tracking-[0.14em]"
                    style={{ fontFamily: MONO }}
                  >
                    <span className="opacity-80">{k}</span>
                    <span>{v}</span>
                  </div>
                  <div className="mt-1.5 h-[4px] bg-white/25">
                    <div className="h-full bg-white" style={{ width: `${v}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-[14px] leading-[1.5] opacity-90">
              Generate is your weakest phase. One thread a week would move it most.
            </p>
          </section>

          {/* Growth */}
          <Tile className="md:col-span-7">
            <div className="flex items-center justify-between">
              <Label>Growth · last 30 days</Label>
              <span
                className="text-[10px] uppercase tracking-[0.14em]"
                style={{ fontFamily: MONO, color: T.muted }}
              >
                7D · <b style={{ color: T.ink }}>30D</b> · 90D
              </span>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-4">
              {[
                ['Followers', followersNow.toLocaleString(), `+${followers7} this week`],
                ['Engagement', '2.6%', '▲ 0.3 vs last week'],
                ['Posts / day', '3.1', '41 original posts'],
                ['Avg views', '8.4K', '▲ 12% vs last week'],
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
              <FollowersChart />
            </div>
          </Tile>

          {/* Post performance */}
          <Tile className="md:col-span-8">
            <Label>What&apos;s working · last 41 posts</Label>
            <div className="mt-5 grid grid-cols-1 gap-8 md:grid-cols-2">
              <div>
                <div className="text-[13px]" style={{ color: T.muted }}>
                  Engagement by format
                </div>
                <div className="mt-3 space-y-3.5">
                  {FORMATS.map((f) => (
                    <div key={f.label}>
                      <div className="mb-1 flex justify-between text-[13px]">
                        <span>
                          {f.label}
                          <span style={{ color: T.muted }}> · {f.share}% of posts</span>
                        </span>
                        <span style={{ fontFamily: MONO }}>{f.er}%</span>
                      </div>
                      <Bar value={f.er} max={maxEr} accent={f.er === maxEr} />
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[13px] leading-[1.5]" style={{ color: T.muted }}>
                  Threads earn the most and you barely post them. Best time: weekdays, 15:00 UTC.
                </p>
              </div>
              <div>
                <div className="text-[13px]" style={{ color: T.muted }}>
                  Best and worst posts
                </div>
                <ul className="mt-3 space-y-4">
                  {[
                    ...TOP_POSTS.map((p) => ({ ...p, low: false })),
                    { ...LOW_POST, low: true },
                  ].map((p) => (
                    <li
                      key={p.text}
                      className="border-l-2 pl-3"
                      style={{ borderColor: p.low ? T.rule : T.blue }}
                    >
                      <div className="text-[14px] leading-[1.4]">“{p.text}”</div>
                      <div className="mt-1 text-[12px]" style={{ color: T.muted }}>
                        <span style={{ fontFamily: MONO, color: p.low ? T.muted : T.ink }}>
                          {p.er}%
                        </span>{' '}
                        · {p.why}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Tile>

          {/* Next moves */}
          <Tile className="md:col-span-4">
            <Label>Next moves</Label>
            <ol className="mt-4 space-y-4">
              {[
                'Post one 5-part thread on brand deals this week.',
                'Cut the “gm” posts; they are 22% of your feed at 0.4%.',
                'Reply to @galileowilson and @kreatorsdao: they amplify you most.',
              ].map((m, i) => (
                <li key={m} className="flex gap-3 text-[14px] leading-[1.45]">
                  <span style={{ fontFamily: MONO, color: T.blue }}>0{i + 1}</span>
                  {m}
                </li>
              ))}
            </ol>
          </Tile>

          {/* Competitors */}
          <Tile className="md:col-span-7">
            <div className="flex items-center justify-between">
              <Label>Competitors</Label>
              <span
                className="text-[10px] uppercase tracking-[0.14em]"
                style={{ fontFamily: MONO, color: T.blue }}
              >
                + Add (3 of 5)
              </span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[460px] text-left text-[13px]">
                <thead>
                  <tr style={{ color: T.muted }}>
                    {['', 'Score', 'Engagement', 'Posts/day', 'Growth 30d'].map((h) => (
                      <th
                        key={h}
                        className="pb-2 text-[10px] font-normal uppercase tracking-[0.14em]"
                        style={{ fontFamily: MONO }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {COMPETITORS.map((c) => (
                    <tr key={c.handle} className="border-t" style={{ borderColor: T.rule }}>
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
                      <td style={{ fontFamily: MONO }}>{c.score}</td>
                      <td className="pr-4">
                        <div className="flex items-center gap-2">
                          <span className="w-10" style={{ fontFamily: MONO }}>
                            {c.er}%
                          </span>
                          <div className="w-20">
                            <Bar value={c.er} max={maxCompEr} accent={!!c.you} />
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: MONO }}>{c.perDay}</td>
                      <td style={{ fontFamily: MONO }}>+{c.growth}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-[13px] leading-[1.5]" style={{ color: T.muted }}>
              @galileowilson posts twice as often and earns 2× your engagement: his posts carry
              media 48% of the time.
            </p>
          </Tile>

          {/* Audience */}
          <Tile className="md:col-span-5">
            <Label>Audience · last 30 days</Label>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <div
                  className="text-[30px] leading-none"
                  style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.03em' }}
                >
                  214
                </div>
                <div className="mt-1 text-[12px]" style={{ color: T.muted }}>
                  people replied or reposted
                </div>
              </div>
              <div>
                <div
                  className="text-[30px] leading-none"
                  style={{ fontFamily: BIG, fontWeight: 500, letterSpacing: '-0.03em' }}
                >
                  38%
                </div>
                <div className="mt-1 text-[12px]" style={{ color: T.muted }}>
                  came back more than once
                </div>
              </div>
            </div>
            <div className="mt-5 text-[13px]" style={{ color: T.muted }}>
              Who engages most
            </div>
            <ul className="mt-2">
              {ENGAGERS.map((e) => (
                <li
                  key={e.handle}
                  className="flex items-center justify-between border-t py-2 text-[13px]"
                  style={{ borderColor: T.rule }}
                >
                  <span>@{e.handle}</span>
                  <span style={{ fontFamily: MONO, color: T.muted }}>
                    {e.replies} replies · {e.reposts} reposts
                  </span>
                </li>
              ))}
            </ul>
          </Tile>

          {/* Idea board */}
          <Tile className="md:col-span-12">
            <Label>Idea board</Label>
            {/* The blank page: a place to think, not a search box */}
            <div
              className="mt-4 grid grid-cols-1 gap-6 border p-5 md:grid-cols-[1fr_260px] md:gap-10 md:p-8"
              style={{
                borderColor: T.rule,
                background: '#FFFFFF',
              }}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  pin();
                }}
              >
                <div className="text-[13px] leading-[1.5]" style={{ color: T.muted }}>
                  Half-formed is fine. Get it out of your head.
                </div>
                <textarea
                  ref={pageRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      pin();
                    }
                  }}
                  rows={3}
                  placeholder={`What should @${brand.handle} say next?`}
                  aria-label="Write an idea"
                  className="mt-3 w-full resize-none bg-transparent text-[26px] leading-[40px] outline-none placeholder:text-black/25 md:text-[32px]"
                  style={{
                    fontFamily: BIG,
                    fontWeight: 500,
                    letterSpacing: '-0.02em',
                    // site-wide form styles give textareas a grey box; this is a page
                    // notebook rules that sit under each 40px line and scroll with the text
                    background:
                      'repeating-linear-gradient(transparent 0 39px, rgba(14,14,14,0.07) 39px 40px)',
                    backgroundAttachment: 'local',
                    border: 'none',
                    borderRadius: 0,
                    boxShadow: 'none',
                    padding: 0,
                    overflow: 'hidden',
                    width: '100%',
                    maxWidth: 'none',
                    fontSize: 'clamp(24px, 2.6vw, 32px)',
                    lineHeight: '40px',
                    color: T.ink,
                  }}
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span
                    className="hidden text-[10px] uppercase tracking-[0.14em] md:inline"
                    style={{ fontFamily: MONO, color: T.muted }}
                  >
                    ⌘ + Enter to pin it
                  </span>
                  <button
                    type="submit"
                    disabled={!draft.trim()}
                    className="ml-auto px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-white transition-opacity disabled:opacity-30"
                    style={{ fontFamily: MONO, background: T.ink }}
                  >
                    Pin to the board →
                  </button>
                </div>
              </form>
              <aside className="md:border-l md:pl-8" style={{ borderColor: T.rule }}>
                <Label>Stuck? Start from</Label>
                <div className="mt-3 flex flex-wrap gap-2 md:flex-col md:items-start">
                  {SPARKS.map((sp) => (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => {
                        setDraft(`${sp}: `);
                        pageRef.current?.focus();
                      }}
                      className="border bg-white px-3 py-2 text-left text-[13px] leading-[1.35] transition-colors hover:border-[#0047FF]"
                      style={{ borderColor: T.rule }}
                    >
                      {sp}
                    </button>
                  ))}
                </div>
              </aside>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {(
                [
                  ['ideas', 'Ideas'],
                  ['drafting', 'Drafting'],
                  ['posted', 'Posted'],
                ] as const
              ).map(([col, title]) => (
                <div
                  key={col}
                  className="border p-3"
                  style={{ borderColor: T.rule, background: T.canvas }}
                >
                  <div className="mb-3 flex justify-between">
                    <Label>{title}</Label>
                    <Label>{ideas.filter((i) => i.col === col).length}</Label>
                  </div>
                  <div className="space-y-2.5">
                    {ideas
                      .filter((i) => i.col === col)
                      .map((i) => (
                        <div
                          key={i.id}
                          className="border bg-white p-3"
                          style={{ borderColor: T.rule }}
                        >
                          {i.why && (
                            <div
                              className="mb-1.5 text-[9px] uppercase tracking-[0.14em]"
                              style={{ fontFamily: MONO, color: T.blue }}
                            >
                              ✦ BrandOS idea
                            </div>
                          )}
                          <div className="text-[14px] leading-[1.4]">{i.text}</div>
                          {i.why && (
                            <div
                              className="mt-1.5 text-[12px] leading-[1.45]"
                              style={{ color: T.muted }}
                            >
                              {i.why}
                            </div>
                          )}
                          <div className="mt-2.5 flex gap-3">
                            {col !== 'drafting' && col !== 'posted' && (
                              <button
                                type="button"
                                onClick={() => move(i.id, 'drafting')}
                                className="text-[10px] uppercase tracking-[0.14em] hover:underline"
                                style={{ fontFamily: MONO }}
                              >
                                Draft it →
                              </button>
                            )}
                            {col === 'drafting' && (
                              <button
                                type="button"
                                onClick={() => move(i.id, 'posted')}
                                className="text-[10px] uppercase tracking-[0.14em] hover:underline"
                                style={{ fontFamily: MONO }}
                              >
                                Mark posted →
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[13px]" style={{ color: T.muted }}>
              New BrandOS ideas every morning, from what&apos;s working on @{brand.handle} and its
              competitors.
            </p>
          </Tile>
        </div>

        <p
          className="mt-10 text-center text-[10px] uppercase tracking-[0.16em]"
          style={{ fontFamily: MONO, color: T.muted }}
        >
          Layout preview · sample data · competitor reads are real (Oct 22)
        </p>
      </div>
    </main>
  );
}
