'use client';

import { useState, useEffect } from 'react';
import { useCurrentBrand } from '@/lib/store';
import { useAuth } from '@/hooks/useAuth';

interface CadenceData {
  thisWeek: {
    scheduled: number;
    drafts: number;
    ideas: number;
  };
  cadence: {
    postsPerWeek: number;
    avgGapDays: number;
    busiestDay: string;
    quietestDay: string;
  };
  recommendations: string[];
  upcoming: {
    id: string;
    content: string;
    scheduledFor: string;
    contentType: string;
  }[];
}

interface CalendarSummaryCardProps {
  onOpenCalendar?: () => void;
}

export default function CalendarSummaryCard({ onOpenCalendar }: CalendarSummaryCardProps) {
  const brand = useCurrentBrand();
  const { user } = useAuth();
  const [data, setData] = useState<CadenceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!brand?.id || !user) {
      setIsLoading(false);
      return;
    }

    const fetchCadence = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/calendar/cadence?brandId=${brand.id}`);
        if (res.ok) {
          setData(await res.json());
        }
      } catch (err) {
        console.error('Failed to fetch cadence:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCadence();
  }, [brand?.id, user]);

  // Determine status indicator
  const getStatusIndicator = () => {
    if (!data) return { label: '--', color: 'var(--text-tertiary)' };
    const { recommendations } = data;
    if (recommendations.some(r => r.startsWith('Heavy'))) {
      return { label: 'Heavy schedule', color: '#FF9F0A' };
    }
    if (recommendations.some(r => r.startsWith('Gap'))) {
      return { label: 'Gap ahead', color: '#FF9F0A' };
    }
    return { label: 'On track', color: '#30D158' };
  };

  const status = getStatusIndicator();

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 16,
        padding: 20,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
          Content Calendar
        </h3>
        <span style={{
          fontSize: 11,
          fontWeight: 500,
          color: status.color,
          background: `${status.color}18`,
          padding: '2px 8px',
          borderRadius: 4,
        }}>
          {status.label}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <div
            className="w-4 h-4 border-2 rounded-full animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
          />
        </div>
      ) : !data ? (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center', padding: '12px 0' }}>
          No calendar data yet
        </p>
      ) : (
        <>
          {/* This week stats */}
          <div className="flex items-center gap-3 mb-3" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            <span>
              <strong style={{ color: 'var(--text-primary)', fontSize: 18 }}>{data.thisWeek.scheduled}</strong>
              <span style={{ fontSize: 11, display: 'block', marginTop: -2 }}>scheduled</span>
            </span>
            <span style={{ opacity: 0.2, fontSize: 16 }}>|</span>
            <span>
              <strong style={{ color: 'var(--text-primary)', fontSize: 18 }}>{data.thisWeek.drafts}</strong>
              <span style={{ fontSize: 11, display: 'block', marginTop: -2 }}>drafts</span>
            </span>
            <span style={{ opacity: 0.2, fontSize: 16 }}>|</span>
            <span>
              <strong style={{ color: 'var(--text-primary)', fontSize: 18 }}>{data.thisWeek.ideas}</strong>
              <span style={{ fontSize: 11, display: 'block', marginTop: -2 }}>ideas</span>
            </span>
          </div>

          {/* Upcoming posts */}
          {data.upcoming.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>
                Coming up
              </span>
              {data.upcoming.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center gap-2"
                  style={{
                    fontSize: 12,
                    color: 'var(--text-primary)',
                    padding: '4px 0',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <span style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: '#0A84FF',
                    background: 'rgba(10,132,255,0.12)',
                    padding: '1px 6px',
                    borderRadius: 4,
                    flexShrink: 0,
                  }}>
                    {new Date(post.scheduledFor).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {post.content}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Recommendations */}
          {data.recommendations.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {data.recommendations.slice(0, 2).map((rec, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 11,
                    color: '#FF9F0A',
                    lineHeight: 1.4,
                    marginBottom: 2,
                  }}
                >
                  {rec}
                </p>
              ))}
            </div>
          )}

          {/* Open Calendar button */}
          {onOpenCalendar && (
            <button
              onClick={onOpenCalendar}
              style={{
                width: '100%',
                fontSize: 12,
                fontWeight: 500,
                padding: '8px 0',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Open Calendar
            </button>
          )}
        </>
      )}
    </div>
  );
}
