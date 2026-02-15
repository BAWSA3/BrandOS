'use client';

interface QuickStatsCardProps {
  postsThisWeek: number;
  avgEngagementRate: number;
  brandConsistency: number;
  brandTrend?: { direction: 'up' | 'down' | 'stable'; delta: number };
}

// Mini sparkline SVG from a set of values
function MiniSparkline({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;
  const width = 48;
  const height = 20;
  const padding = 2;

  const points = values
    .map((v, i) => {
      const x = padding + (i / (values.length - 1)) * (width - padding * 2);
      const y = padding + (1 - (v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrendArrow({ direction }: { direction: 'up' | 'down' | 'stable' }) {
  if (direction === 'stable') {
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.5">
        <path d="M5 12h14" strokeLinecap="round" />
      </svg>
    );
  }
  const isUp = direction === 'up';
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke={isUp ? 'var(--success)' : 'var(--danger)'}
      strokeWidth="2.5"
    >
      <path
        d={isUp ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function QuickStatsCard({
  postsThisWeek,
  avgEngagementRate,
  brandConsistency,
  brandTrend,
}: QuickStatsCardProps) {
  // Generate simple sparkline data (simulate weekly trend)
  const postsSparkline = [
    Math.max(0, postsThisWeek - 3),
    Math.max(0, postsThisWeek - 1),
    postsThisWeek,
  ];
  const engagementSparkline = [
    Math.max(0, avgEngagementRate - 0.8),
    Math.max(0, avgEngagementRate - 0.2),
    avgEngagementRate,
  ];
  const consistencySparkline = [
    Math.max(0, brandConsistency - 10),
    Math.max(0, brandConsistency - 3),
    brandConsistency,
  ];

  const stats = [
    {
      label: 'Posts this week',
      value: postsThisWeek.toString(),
      trend: postsThisWeek > 0 ? ('up' as const) : ('stable' as const),
      sparkline: postsSparkline,
      color: '#0A84FF',
    },
    {
      label: 'Avg. engagement',
      value: `${avgEngagementRate.toFixed(1)}%`,
      trend: avgEngagementRate > 1 ? ('up' as const) : avgEngagementRate > 0 ? ('stable' as const) : ('down' as const),
      sparkline: engagementSparkline,
      color: '#30D158',
    },
    {
      label: 'Brand health',
      value: `${brandConsistency}%`,
      trend: brandTrend?.direction ?? (brandConsistency > 50 ? ('up' as const) : brandConsistency > 0 ? ('stable' as const) : ('down' as const)),
      sparkline: consistencySparkline,
      color: '#BF5AF2',
    },
  ];

  return (
    <div
      style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}
      className="h-full flex flex-col justify-between"
    >
      <h3
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--text-secondary)',
          marginBottom: 20,
          letterSpacing: '-0.01em',
        }}
      >
        Quick Stats
      </h3>
      <div className="space-y-5 flex-1">
        {stats.map((stat) => (
          <div key={stat.label}>
            <div className="flex items-center justify-between mb-1">
              <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{stat.label}</p>
              <div className="flex items-center gap-2">
                <MiniSparkline values={stat.sparkline} color={stat.color} />
                <TrendArrow direction={stat.trend} />
              </div>
            </div>
            <p
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
