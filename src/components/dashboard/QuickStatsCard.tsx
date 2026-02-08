'use client';

import { TrendingUp, TrendingDown, Minus, MessageSquare, BarChart3, Shield } from 'lucide-react';

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
    {
      label: 'Posts This Week',
      value: postsThisWeek.toString(),
      icon: MessageSquare,
      color: '#2E6AFF',
      trend: postsThisWeek > 3 ? 'up' as const : postsThisWeek > 0 ? 'stable' as const : 'down' as const,
    },
    {
      label: 'Avg Engagement',
      value: `${avgEngagementRate}%`,
      icon: BarChart3,
      color: '#00FF41',
      trend: avgEngagementRate > 2 ? 'up' as const : avgEngagementRate > 0 ? 'stable' as const : 'down' as const,
    },
    {
      label: 'Brand Score',
      value: brandConsistency > 0 ? `${brandConsistency}%` : '—',
      icon: Shield,
      color: '#A855F7',
      trend: brandConsistency > 70 ? 'up' as const : brandConsistency > 0 ? 'stable' as const : 'down' as const,
    },
  ];

  const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
    if (trend === 'up') return <TrendingUp className="w-3 h-3 text-[#00FF41]" />;
    if (trend === 'down') return <TrendingDown className="w-3 h-3 text-red-400" />;
    return <Minus className="w-3 h-3 text-white/30" />;
  };

  return (
    <div
      className="col-span-1 row-span-1 rounded-2xl border p-5 space-y-3"
      style={{
        background: 'rgba(15, 15, 15, 0.85)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      <h3 className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">
        Quick Stats
      </h3>

      <div className="space-y-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.04]"
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${stat.color}15` }}
            >
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-white/40">{stat.label}</p>
              <p className="text-sm font-semibold text-white">{stat.value}</p>
            </div>
            <TrendIcon trend={stat.trend} />
          </div>
        ))}
      </div>
    </div>
  );
}
