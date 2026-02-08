'use client';

import { Loader2, Sparkles } from 'lucide-react';
import type { DashboardInsight } from '@/app/api/dashboard/insights/route';

interface AIInsightsPanelProps {
  insights: DashboardInsight[];
  isLoading: boolean;
}

export default function AIInsightsPanel({ insights, isLoading }: AIInsightsPanelProps) {
  return (
    <div
      className="col-span-3 rounded-2xl border p-5"
      style={{
        background: 'rgba(15, 15, 15, 0.85)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-3.5 h-3.5 text-[#FFD700]" />
        <h3 className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">
          AI Performance Insights
        </h3>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-3 py-6 justify-center">
          <Loader2 className="w-4 h-4 text-white/20 animate-spin" />
          <span className="text-xs text-white/30">Analyzing your performance...</span>
        </div>
      ) : insights.length === 0 ? (
        <p className="text-xs text-white/30 py-4 text-center">
          Post more content to unlock AI-powered insights about your performance.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {insights.map((insight, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <span className="text-base shrink-0">{insight.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[11px] font-medium text-white/80 truncate">
                      {insight.title}
                    </p>
                    {insight.metric && (
                      <span
                        className={`text-[10px] font-mono shrink-0 ${
                          insight.trend === 'up'
                            ? 'text-[#00FF41]'
                            : insight.trend === 'down'
                            ? 'text-red-400'
                            : 'text-white/40'
                        }`}
                      >
                        {insight.metric}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-white/40 leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
