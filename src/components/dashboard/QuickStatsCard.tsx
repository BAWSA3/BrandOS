'use client';

interface QuickStatsCardProps {
  postsThisWeek: number;
  avgEngagementRate: number;
  brandConsistency: number;
}

export default function QuickStatsCard({
  postsThisWeek,
  avgEngagementRate,
  brandConsistency,
}: QuickStatsCardProps) {
  const stats = [
    { label: 'Posts this week', value: postsThisWeek.toString() },
    { label: 'Avg. engagement', value: `${avgEngagementRate.toFixed(1)}%` },
    { label: 'Brand score', value: `${brandConsistency}%` },
  ];

  return (
    <div style={{ background: '#1C1C1E', borderRadius: 16, padding: 24 }} className="h-full flex flex-col justify-between">
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#86868B', marginBottom: 20, letterSpacing: '-0.01em' }}>
        Quick Stats
      </h3>
      <div className="space-y-5 flex-1">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p style={{ fontSize: 12, color: '#6E6E73', marginBottom: 2 }}>{stat.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: '#F5F5F7', letterSpacing: '-0.02em' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
