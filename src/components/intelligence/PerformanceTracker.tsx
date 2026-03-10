'use client';

import { useState, useEffect } from 'react';

interface PerformanceData {
  totalPosts: number;
  totalImpressions: number;
  totalLikes: number;
  totalRetweets: number;
  totalReplies: number;
  avgEngagementRate: number;
  avgImpressions: number;
  bestPostingHour: number | null;
  bestPostingDay: string | null;
  avgPostLength: number | null;
  topTweetId: string | null;
  bottomTweetId: string | null;
  computedAt: string;
}

interface PerformanceTrackerProps {
  brandId: string;
}

export default function PerformanceTracker({ brandId }: PerformanceTrackerProps) {
  const [window, setWindow] = useState<3 | 7 | 30>(7);
  const [data, setData] = useState<PerformanceData | null>(null);
  const [history, setHistory] = useState<PerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, [brandId, window]);

  async function fetchPerformance() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/content-intelligence/performance?brandId=${brandId}&window=${window}`);
      if (res.ok) {
        const result = await res.json();
        setData(result.snapshot);
        setHistory(result.history || []);
      }
    } catch {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }

  // Mini sparkline from history
  function Sparkline({ values, color }: { values: number[]; color: string }) {
    if (values.length < 2) return null;
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min || 1;
    const w = 60, h = 20, pad = 2;
    const points = values.map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  const engagementHistory = history.map(h => h.avgEngagementRate).reverse();
  const impressionHistory = history.map(h => h.avgImpressions).reverse();

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 16,
        padding: 24,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        fontFamily: '"VCR OSD Mono", "JetBrains Mono", monospace',
      }}
      className="h-full flex flex-col"
    >
      {/* Header with window toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Performance
        </h3>
        <div className="flex gap-1">
          {([3, 7, 30] as const).map(w => (
            <button
              key={w}
              onClick={() => setWindow(w)}
              style={{
                fontSize: 10,
                fontWeight: window === w ? 600 : 400,
                color: window === w ? '#0047FF' : 'var(--text-tertiary)',
                background: window === w ? 'rgba(0,71,255,0.08)' : 'transparent',
                border: 'none',
                borderRadius: 4,
                padding: '3px 8px',
                cursor: 'pointer',
                transition: 'all 150ms ease',
              }}
            >
              {w}d
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : !data || data.totalPosts === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p style={{ fontSize: 12, color: 'var(--text-tertiary)', textAlign: 'center' }}>
            No posts in this window.<br />Sync your tweets to see data.
          </p>
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 2 }}>Posts</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{data.totalPosts}</p>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 2 }}>Eng. Rate</p>
                <Sparkline values={engagementHistory} color="#30D158" />
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: '#30D158' }}>{data.avgEngagementRate.toFixed(1)}%</p>
            </div>
            <div>
              <div className="flex items-center gap-1">
                <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 2 }}>Avg Imp</p>
                <Sparkline values={impressionHistory} color="#0A84FF" />
              </div>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{formatNumber(data.avgImpressions)}</p>
            </div>
            <div>
              <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 2 }}>Total Likes</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{formatNumber(data.totalLikes)}</p>
            </div>
          </div>

          {/* Best timing */}
          <div style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 4, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Best Timing
            </p>
            <div className="flex gap-4">
              {data.bestPostingDay && (
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Day: </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {data.bestPostingDay}
                  </span>
                </div>
              )}
              {data.bestPostingHour !== null && (
                <div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Hour: </span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {data.bestPostingHour}:00 UTC
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toString();
}
