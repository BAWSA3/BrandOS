'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3, RefreshCw } from 'lucide-react';

interface ScanEntry {
  score: number;
  archetype: string | null;
  phaseScores: {
    define: number;
    check: number;
    generate: number;
    scale: number;
  } | null;
  createdAt: string;
}

interface ScanStats {
  totalScans: number;
  highScore: number;
  lowScore: number;
  averageScore: number;
  currentScore: number;
  firstScan: string;
  lastScan: string;
}

interface ScanHistoryData {
  username: string;
  scans: ScanEntry[];
  stats: ScanStats | null;
  deltas: Record<string, number> | null;
}

function Sparkline({
  data,
  width = 200,
  height = 48,
}: {
  data: number[];
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;

  const points = data.map((val, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const lastPoint = points[points.length - 1].split(',');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke="#0047FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastPoint[0]} cy={lastPoint[1]} r="3" fill="#0047FF" />
    </svg>
  );
}

function DeltaBadge({ value, label }: { value: number; label: string }) {
  const isPositive = value > 0;
  const isZero = value === 0;

  return (
    <div className="flex items-center gap-1.5">
      <span
        className="text-[10px] uppercase tracking-widest"
        style={{ color: '#666', fontFamily: 'var(--font-vcr, monospace)' }}
      >
        {label}
      </span>
      <span
        className="flex items-center gap-0.5 text-xs font-bold"
        style={{
          color: isZero ? '#666' : isPositive ? '#16a34a' : '#dc2626',
        }}
      >
        {isZero ? (
          <Minus className="h-3 w-3" />
        ) : isPositive ? (
          <TrendingUp className="h-3 w-3" />
        ) : (
          <TrendingDown className="h-3 w-3" />
        )}
        {isPositive ? '+' : ''}
        {value}
      </span>
    </div>
  );
}

export default function ScoreHistoryCard({ username }: { username?: string }) {
  const [data, setData] = useState<ScanHistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const params = username ? `?username=${username}` : '';
        const res = await fetch(`/api/scan-history${params}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch scan history:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [username]);

  if (loading) {
    return (
      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" style={{ color: '#0047FF' }} />
          <span
            className="text-xs uppercase tracking-widest"
            style={{ color: '#666', fontFamily: 'var(--font-vcr, monospace)' }}
          >
            score history
          </span>
        </div>
        <div className="flex h-20 items-center justify-center">
          <RefreshCw className="h-4 w-4 animate-spin" style={{ color: '#444' }} />
        </div>
      </div>
    );
  }

  if (!data || !data.stats || data.scans.length === 0) {
    return (
      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: 'rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" style={{ color: '#0047FF' }} />
          <span
            className="text-xs uppercase tracking-widest"
            style={{ color: '#666', fontFamily: 'var(--font-vcr, monospace)' }}
          >
            score history
          </span>
        </div>
        <p className="text-sm" style={{ color: '#666' }}>
          no scan data yet. scan your brand to start tracking progress.
        </p>
      </div>
    );
  }

  const { stats, deltas, scans } = data;
  const scores = scans.map((s) => s.score);
  const latestArchetype = scans[scans.length - 1]?.archetype;

  // Detect archetype changes
  const archetypeChanges: { from: string; to: string; index: number }[] = [];
  for (let i = 1; i < scans.length; i++) {
    if (
      scans[i].archetype &&
      scans[i - 1].archetype &&
      scans[i].archetype !== scans[i - 1].archetype
    ) {
      archetypeChanges.push({
        from: scans[i - 1].archetype!,
        to: scans[i].archetype!,
        index: i,
      });
    }
  }

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        borderColor: 'rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.02)',
      }}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4" style={{ color: '#0047FF' }} />
          <span
            className="text-xs uppercase tracking-widest"
            style={{ color: '#666', fontFamily: 'var(--font-vcr, monospace)' }}
          >
            score history
          </span>
        </div>
        <span
          className="text-[10px] uppercase tracking-widest"
          style={{ color: '#444', fontFamily: 'var(--font-vcr, monospace)' }}
        >
          {stats.totalScans} scan{stats.totalScans !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Sparkline */}
      {scores.length >= 2 ? (
        <div className="mb-4">
          <Sparkline data={scores} height={48} />
        </div>
      ) : (
        <div
          className="mb-4 flex items-center justify-center rounded-lg py-4"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px dashed rgba(255,255,255,0.08)',
          }}
        >
          <p className="text-xs" style={{ color: '#555' }}>
            scan again to see your trend line
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        {[
          { label: 'current', value: stats.currentScore },
          { label: 'high', value: stats.highScore },
          { label: 'low', value: stats.lowScore },
          { label: 'avg', value: stats.averageScore },
        ].map((stat) => (
          <div key={stat.label} className="text-center">
            <div
              className="text-lg font-bold"
              style={{ color: '#fff', fontFamily: 'var(--font-vcr, monospace)' }}
            >
              {stat.value}
            </div>
            <div
              className="text-[9px] uppercase tracking-widest"
              style={{ color: '#555', fontFamily: 'var(--font-vcr, monospace)' }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Deltas */}
      {deltas && (
        <div
          className="space-y-1.5 border-t pt-3"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p
            className="mb-2 text-[9px] uppercase tracking-widest"
            style={{ color: '#444', fontFamily: 'var(--font-vcr, monospace)' }}
          >
            since last scan
          </p>
          <div className="grid grid-cols-2 gap-2">
            <DeltaBadge value={deltas.overall} label="overall" />
            {deltas.define != null && <DeltaBadge value={deltas.define} label="define" />}
            {deltas.check != null && <DeltaBadge value={deltas.check} label="check" />}
            {deltas.generate != null && <DeltaBadge value={deltas.generate} label="generate" />}
            {deltas.scale != null && <DeltaBadge value={deltas.scale} label="scale" />}
          </div>
        </div>
      )}

      {/* Archetype changes */}
      {archetypeChanges.length > 0 && (
        <div
          className="mt-3 border-t pt-3"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <p
            className="mb-2 text-[9px] uppercase tracking-widest"
            style={{ color: '#444', fontFamily: 'var(--font-vcr, monospace)' }}
          >
            archetype evolution
          </p>
          {archetypeChanges.map((change, i) => (
            <div key={i} className="flex items-center gap-2 text-xs" style={{ color: '#888' }}>
              <span style={{ color: '#666' }}>{change.from}</span>
              <span style={{ color: '#0047FF' }}>→</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{change.to}</span>
            </div>
          ))}
        </div>
      )}

      {/* Current archetype */}
      {latestArchetype && archetypeChanges.length === 0 && (
        <div
          className="mt-3 border-t pt-3"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div className="flex items-center gap-2">
            <span
              className="text-[9px] uppercase tracking-widest"
              style={{ color: '#444', fontFamily: 'var(--font-vcr, monospace)' }}
            >
              archetype
            </span>
            <span
              className="text-xs font-bold"
              style={{ color: '#0047FF', fontFamily: 'var(--font-vcr, monospace)' }}
            >
              {latestArchetype}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
