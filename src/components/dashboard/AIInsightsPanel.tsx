'use client';

import type { DashboardInsight } from '@/app/api/dashboard/insights/route';

interface AIInsightsPanelProps {
  insights: DashboardInsight[];
  isLoading: boolean;
}

export default function AIInsightsPanel({ insights, isLoading }: AIInsightsPanelProps) {
  return (
    <div style={{ background: '#1C1C1E', borderRadius: 16, padding: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#86868B', marginBottom: 16, letterSpacing: '-0.01em' }}>
        AI Insights
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: '#2C2C2E', borderTopColor: '#0A84FF' }}
          />
        </div>
      ) : insights.length === 0 ? (
        <p style={{ fontSize: 14, color: '#48484A', padding: '24px 0', textAlign: 'center' }}>
          Add more posts to unlock AI-powered insights about your content performance.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {insights.map((insight, i) => (
            <div
              key={i}
              style={{ background: '#2C2C2E', borderRadius: 12, padding: 16 }}
            >
              <p style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F7', marginBottom: 6 }}>
                {insight.title}
              </p>
              <p style={{ fontSize: 13, color: '#86868B', lineHeight: 1.5 }}>
                {insight.description}
              </p>
              {insight.metric && (
                <p style={{ fontSize: 20, fontWeight: 700, color: '#0A84FF', marginTop: 8, letterSpacing: '-0.02em' }}>
                  {insight.metric}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
