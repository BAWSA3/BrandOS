'use client';

import type { ContentIdea } from '@/app/api/dashboard/ideas/route';

interface AIIdeaFeedProps {
  ideas: ContentIdea[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreatePost: (topic: string, tone: string) => void;
}

export default function AIIdeaFeed({ ideas, isLoading, onRefresh, onCreatePost }: AIIdeaFeedProps) {
  return (
    <div style={{ background: '#1C1C1E', borderRadius: 16, padding: 24 }} className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#86868B', letterSpacing: '-0.01em' }}>
          Content Ideas
        </h3>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          style={{
            fontSize: 13,
            color: '#0A84FF',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            opacity: isLoading ? 0.4 : 1,
            transition: 'opacity 150ms ease',
          }}
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: '#2C2C2E', borderTopColor: '#0A84FF' }}
          />
        </div>
      ) : ideas.length === 0 ? (
        <p style={{ fontSize: 14, color: '#48484A', padding: '24px 0', textAlign: 'center' }}>
          Complete your Brand DNA to get personalized content ideas.
        </p>
      ) : (
        <div className="space-y-2">
          {ideas.map((idea, i) => (
            <div
              key={i}
              className="flex items-start justify-between gap-3 py-3"
              style={{ borderBottom: i < ideas.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
            >
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: 14, color: '#F5F5F7', marginBottom: 4, lineHeight: 1.4 }}>
                  {idea.hook}
                </p>
                <div className="flex items-center gap-2">
                  {idea.suggestedTone && (
                    <span style={{ fontSize: 11, color: '#6E6E73', background: '#2C2C2E', padding: '2px 8px', borderRadius: 4 }}>
                      {idea.suggestedTone}
                    </span>
                  )}
                  {idea.category && (
                    <span style={{ fontSize: 11, color: '#48484A' }}>
                      {idea.category}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onCreatePost(idea.hook, idea.suggestedTone || 'casual')}
                style={{
                  fontSize: 12,
                  color: '#0A84FF',
                  background: 'rgba(10,132,255,0.1)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '6px 12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'opacity 150ms ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
              >
                Create
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
