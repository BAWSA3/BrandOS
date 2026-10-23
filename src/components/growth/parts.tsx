'use client';

import { useState } from 'react';

/** Growth dashboard building blocks, in the locked BrandOS system (bone, Klein, mono labels). */

export const BIG = "'Inter Tight', 'Helvetica Neue', Helvetica, Arial, sans-serif";
export const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";
export const T = {
  canvas: '#F2EFE8',
  tile: '#FAF8F3',
  ink: '#0E0E0E',
  muted: '#6B6862',
  rule: 'rgba(14,14,14,0.10)',
  track: 'rgba(14,14,14,0.08)',
  blue: '#0047FF',
};

export function Label({
  children,
  color = T.muted,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="text-[10px] uppercase tracking-[0.16em]" style={{ fontFamily: MONO, color }}>
      {children}
    </div>
  );
}

export function Tile({
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

export function Bar({
  value,
  max,
  accent = false,
}: {
  value: number;
  max: number;
  accent?: boolean;
}) {
  return (
    <div className="h-[6px] w-full" style={{ background: T.track }}>
      <div
        className="h-full"
        style={{
          width: `${max > 0 ? Math.max(2, (value / max) * 100) : 2}%`,
          background: accent ? T.blue : T.ink,
          borderRadius: '0 4px 4px 0',
        }}
      />
    </div>
  );
}

const shortDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

/** Followers line: one series, 2px, recessive grid, hover readout. Needs 2+ days. */
export function FollowersChart({ series }: { series: { day: string; followers: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640;
  const H = 150;
  const vals = series.map((s) => s.followers);
  const pad = Math.max(10, (Math.max(...vals) - Math.min(...vals)) * 0.15);
  const min = Math.min(...vals) - pad;
  const max = Math.max(...vals) + pad;
  const x = (i: number) => (i / (series.length - 1)) * W;
  const y = (v: number) => H - ((v - min) / (max - min)) * H;
  const d = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const i = hover ?? series.length - 1;
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <Label>Followers</Label>
        <span className="text-[11px]" style={{ fontFamily: MONO, color: T.ink }}>
          {vals[i].toLocaleString()}
          <span style={{ color: T.muted }}>
            {' '}
            · {i === series.length - 1 ? 'today' : shortDay(series[i].day)}
          </span>
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H + 18}`}
        className="block w-full"
        role="img"
        aria-label={`Followers from ${vals[0].toLocaleString()} on ${shortDay(series[0].day)} to ${vals.at(-1)!.toLocaleString()} today`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const k = Math.round(((e.clientX - r.left) / r.width) * (series.length - 1));
          setHover(Math.max(0, Math.min(series.length - 1, k)));
        }}
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1={0} x2={W} y1={H * f} y2={H * f} stroke={T.track} strokeWidth={1} />
        ))}
        <path d={d} fill="none" stroke={T.blue} strokeWidth={2} strokeLinejoin="round" />
        <line x1={x(i)} x2={x(i)} y1={0} y2={H} stroke={T.rule} strokeWidth={1} />
        <circle cx={x(i)} cy={y(vals[i])} r={4} fill={T.blue} stroke={T.tile} strokeWidth={2} />
        <text x={0} y={H + 15} fontSize={10} fill={T.muted} style={{ fontFamily: MONO }}>
          {shortDay(series[0].day).toUpperCase()}
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

export const fmt = {
  int: (n: number | null) => (n === null ? '—' : Math.round(n).toLocaleString()),
  compact: (n: number | null) =>
    n === null
      ? '—'
      : n >= 1_000_000
        ? `${(n / 1_000_000).toFixed(1)}M`
        : n >= 10_000
          ? `${Math.round(n / 1000)}K`
          : n >= 1000
            ? `${(n / 1000).toFixed(1)}K`
            : String(Math.round(n)),
  pct: (n: number | null, d = 1) => (n === null ? '—' : `${n.toFixed(d)}%`),
  signed: (n: number | null, d = 0, unit = '') =>
    n === null ? null : `${n >= 0 ? '▲' : '▼'} ${Math.abs(n).toFixed(d)}${unit}`,
};
