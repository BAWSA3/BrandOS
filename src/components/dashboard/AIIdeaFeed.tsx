'use client';

import type { ContentIdea } from '@/app/api/dashboard/ideas/route';

interface AIIdeaFeedProps {
  ideas: ContentIdea[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreatePost: (topic: string, tone: string) => void;
  onSaveToCalendar?: (topic: string, tone: string) => void;
}

const tonePillColors: Record<string, { bg: string; text: string }> = {
  'hot-take': { bg: 'rgba(255,69,58,0.12)', text: '#FF453A' },
  'educational': { bg: 'rgba(48,209,88,0.12)', text: '#30D158' },
  'casual': { bg: 'rgba(10,132,255,0.12)', text: '#0A84FF' },
  'launch': { bg: 'rgba(191,90,242,0.12)', text: '#BF5AF2' },
  'behind-the-scenes': { bg: 'rgba(255,159,10,0.12)', text: '#FF9F0A' },
  'announcement': { bg: 'rgba(100,210,255,0.12)', text: '#64D2FF' },
  'engagement-bait': { bg: 'rgba(255,214,10,0.12)', text: '#FFD60A' },
  'thread-starter': { bg: 'rgba(172,142,104,0.12)', text: '#AC8E68' },
};

const categoryLabels: Record<string, string> = {
  trending: 'Trending in your niche',
  'best-performing': 'Based on your best posts',
  'brand-aligned': 'Matches your brand DNA',
  timely: 'Timely opportunity',
};

export default function AIIdeaFeed({ ideas, isLoading, onRefresh, onCreatePost, onSaveToCalendar }: AIIdeaFeedProps) {
  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }} className="h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
          Content Ideas
        </h3>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5"
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
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={isLoading ? 'animate-spin' : ''}
          >
            <path d="M23 4v6h-6" />
            <path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
          />
        </div>
      ) : ideas.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--text-tertiary)', padding: '24px 0', textAlign: 'center' }}>
          Complete your Brand DNA to get personalized content ideas.
        </p>
      ) : (
        <div className="space-y-2">
          {ideas.map((idea, i) => {
            const pillStyle = tonePillColors[idea.tone] || tonePillColors['casual'];
            return (
              <div
                key={idea.id || i}
                className="py-3"
                style={{
                  borderBottom:
                    i < ideas.length - 1
                      ? '1px solid var(--border)'
                      : 'none',
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Hook / topic line */}
                    <p
                      style={{
                        fontSize: 14,
                        color: 'var(--text-primary)',
                        marginBottom: 6,
                        lineHeight: 1.4,
                      }}
                    >
                      {idea.hook}
                    </p>

                    {/* Tone pill + category */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {idea.tone && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: pillStyle.text,
                            background: pillStyle.bg,
                            padding: '2px 8px',
                            borderRadius: 4,
                          }}
                        >
                          {idea.tone.replace(/-/g, ' ')}
                        </span>
                      )}
                      {idea.category && (
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                          {categoryLabels[idea.category] || idea.category}
                        </span>
                      )}
                    </div>

                    {/* Relevance reason */}
                    {idea.reason && (
                      <p
                        style={{
                        fontSize: 12,
                        color: 'var(--text-secondary)',
                          marginTop: 4,
                          lineHeight: 1.4,
                        }}
                      >
                        {idea.reason}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5" style={{ marginTop: 2 }}>
                    <button
                      onClick={() =>
                        onCreatePost(
                          idea.prefillTopic || idea.hook,
                          idea.prefillTone || idea.tone || 'casual'
                        )
                      }
                      style={{
                        fontSize: 12,
                        fontWeight: 500,
                        color: '#0A84FF',
                        background: 'rgba(10,132,255,0.1)',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 14px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'all 150ms ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(10,132,255,0.18)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(10,132,255,0.1)';
                      }}
                    >
                      Create Post
                    </button>
                    {onSaveToCalendar && (
                      <button
                        onClick={() =>
                          onSaveToCalendar(
                            idea.prefillTopic || idea.hook,
                            idea.prefillTone || idea.tone || 'casual'
                          )
                        }
                        style={{
                          fontSize: 11,
                          fontWeight: 500,
                          color: 'var(--text-secondary)',
                          background: 'var(--surface-hover)',
                          border: 'none',
                          borderRadius: 6,
                          padding: '4px 10px',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 150ms ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--text-primary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        Save to Calendar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
