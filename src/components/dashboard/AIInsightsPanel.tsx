'use client';

import type { DashboardInsight } from '@/app/api/dashboard/insights/route';

interface AIInsightsPanelProps {
  insights: DashboardInsight[];
  isLoading: boolean;
}

const trendColors: Record<string, string> = {
  up: '#30D158',
  down: '#FF453A',
  stable: 'var(--text-secondary)',
};

const typeIcons: Record<string, string> = {
  performance: '📊',
  timing: '⏰',
  content: '📝',
  brand: '🎯',
  growth: '📈',
};

export default function AIInsightsPanel({ insights, isLoading }: AIInsightsPanelProps) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
          AI Insights
        </h3>
        {insights.length > 0 && (
          <span
            style={{
              fontSize: 11,
              color: '#0A84FF',
              background: 'rgba(10,132,255,0.1)',
              padding: '2px 8px',
              borderRadius: 4,
              fontWeight: 500,
            }}
          >
            {insights.length} insights
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
          />
        </div>
      ) : insights.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 4 }}>
            Add more posts to unlock AI-powered insights.
          </p>
          <p style={{ fontSize: 12, color: 'var(--text-quaternary)' }}>
            We&apos;ll analyze your content performance and give actionable suggestions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((insight, i) => (
            <div
              key={i}
              className="transition-colors"
              style={{
                background: 'var(--surface-hover)',
                borderRadius: 12,
                padding: 16,
                border: '1px solid var(--border)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(10,132,255,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border)';
              }}
            >
              <div className="flex items-start gap-3">
                <span style={{ fontSize: 18 }}>
                  {insight.icon || typeIcons[insight.type] || '💡'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}
                    >
                      {insight.title}
                    </p>
                    {insight.trend && (
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={trendColors[insight.trend] || '#6E6E73'}
                        strokeWidth="3"
                      >
                        <path
                          d={
                            insight.trend === 'up'
                              ? 'M18 15l-6-6-6 6'
                              : insight.trend === 'down'
                                ? 'M6 9l6 6 6-6'
                                : 'M5 12h14'
                          }
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                    }}
                  >
                    {insight.description}
                  </p>
                  {insight.metric && (
                    <p
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#0A84FF',
                        marginTop: 8,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {insight.metric}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
