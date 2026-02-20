'use client';

import { useState } from 'react';
import { useXFeedSync, FeedTweet } from '@/hooks/useXFeedSync';
import { useCurrentBrand } from '@/lib/store';
import RepurposePanel from '@/components/calendar/RepurposePanel';
import type { CalendarDraft } from '@/hooks/useCalendarDrafts';

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

function AlignmentBadge({ score }: { score: number | null }) {
  if (score === null) {
    return (
      <span
        style={{
          display: 'inline-block',
          fontSize: 11,
          fontWeight: 600,
          padding: '2px 6px',
          borderRadius: 6,
          background: 'rgba(128,128,128,0.12)',
          color: 'var(--text-tertiary)',
        }}
      >
        --
      </span>
    );
  }

  const bg =
    score >= 80
      ? 'rgba(52,199,89,0.12)'
      : score >= 50
        ? 'rgba(255,204,0,0.12)'
        : 'rgba(255,59,48,0.12)';
  const color =
    score >= 80
      ? 'var(--success, #34c759)'
      : score >= 50
        ? 'var(--warning, #ffcc00)'
        : 'var(--error, #ff3b30)';

  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 6px',
        borderRadius: 6,
        background: bg,
        color,
      }}
    >
      {score}
    </span>
  );
}

function TweetCard({ tweet, maxEngagement, onRepurpose }: { tweet: FeedTweet; maxEngagement: number; onRepurpose?: (tweet: FeedTweet) => void }) {
  const total = tweet.metrics.likes + tweet.metrics.retweets + tweet.metrics.replies;
  const engagementRatio = total / maxEngagement;

  return (
    <div
      className="shrink-0 flex flex-col justify-between"
      style={{
        width: 260,
        background: 'var(--surface-hover)',
        borderRadius: 12,
        padding: 16,
        border: '1px solid var(--border)',
        transition: 'border-color 200ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(10,132,255,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* Header: alignment badge + time */}
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <AlignmentBadge score={tweet.alignmentScore} />
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
          {formatTimeAgo(tweet.postedAt)}
        </span>
      </div>

      {/* Tweet text */}
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-primary)',
          lineHeight: 1.5,
          marginBottom: 12,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {tweet.text}
      </p>

      <div>
        {/* Engagement bar */}
        <div
          style={{
            height: 3,
            background: 'rgba(0,0,0,0.06)',
            borderRadius: 2,
            marginBottom: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.max(engagementRatio * 100, 5)}%`,
              background:
                engagementRatio > 0.7
                  ? 'var(--success)'
                  : engagementRatio > 0.4
                    ? 'var(--accent)'
                    : 'var(--text-tertiary)',
              borderRadius: 2,
              transition: 'width 0.5s ease-out',
            }}
          />
        </div>

        {/* Metrics row */}
        <div className="flex items-center gap-3">
          <span
            className="flex items-center gap-1"
            style={{ fontSize: 12, color: 'var(--text-secondary)' }}
            title="Likes"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            {formatNumber(tweet.metrics.likes)}
          </span>
          <span
            className="flex items-center gap-1"
            style={{ fontSize: 12, color: 'var(--text-secondary)' }}
            title="Reposts"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 1l4 4-4 4" />
              <path d="M3 11V9a4 4 0 014-4h14" />
              <path d="M7 23l-4-4 4-4" />
              <path d="M21 13v2a4 4 0 01-4 4H3" />
            </svg>
            {formatNumber(tweet.metrics.retweets)}
          </span>
          <span
            className="flex items-center gap-1"
            style={{ fontSize: 12, color: 'var(--text-secondary)' }}
            title="Replies"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
            </svg>
            {formatNumber(tweet.metrics.replies)}
          </span>
          {tweet.metrics.impressions > 0 && (
            <span
              className="flex items-center gap-1"
              style={{ fontSize: 12, color: 'var(--text-tertiary)' }}
              title="Views"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {formatNumber(tweet.metrics.impressions)}
            </span>
          )}
          {onRepurpose && (
            <button
              onClick={() => onRepurpose(tweet)}
              className="flex items-center gap-1 ml-auto"
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--text-tertiary)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '1px 4px',
                borderRadius: 4,
                transition: 'color 150ms ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#0A84FF'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" />
              </svg>
              Repurpose
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrandFeedCard() {
  const { tweets, stats, isLoading, isSyncing, error, sync } = useXFeedSync();
  const brand = useCurrentBrand();
  const [repurposeSource, setRepurposeSource] = useState<CalendarDraft | null>(null);

  const handleRepurposeTweet = (tweet: FeedTweet) => {
    // Convert FeedTweet to CalendarDraft-like shape for the RepurposePanel
    setRepurposeSource({
      id: tweet.id,
      content: tweet.text,
      contentType: 'tweet',
      tone: 'casual',
      status: 'published',
      scheduledFor: null,
      sourceType: null,
      sourceId: null,
      authenticity: null,
      parentId: null,
      parent: null,
      childrenCount: 0,
      createdAt: tweet.postedAt,
      updatedAt: tweet.postedAt,
    });
  };

  const maxEngagement = tweets.length === 0
    ? 1
    : Math.max(
        ...tweets.map(t => t.metrics.likes + t.metrics.retweets + t.metrics.replies),
        1,
      );

  return (
    <div
      style={{
        background: 'var(--surface)',
        borderRadius: 16,
        padding: 24,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              letterSpacing: '-0.01em',
            }}
          >
            Brand Feed
          </h3>
          {stats.totalSynced > 0 && (
            <div className="flex items-center gap-2" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              <span>{stats.totalSynced} tweets</span>
              {stats.avgEngagementRate !== null && (
                <>
                  <span style={{ opacity: 0.4 }}>|</span>
                  <span>{stats.avgEngagementRate}% avg engagement</span>
                </>
              )}
              {stats.avgAlignmentScore !== null && (
                <>
                  <span style={{ opacity: 0.4 }}>|</span>
                  <span>Alignment: {stats.avgAlignmentScore}</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {stats.lastSyncAt && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              Synced {formatTimeAgo(stats.lastSyncAt)}
            </span>
          )}
          <button
            onClick={sync}
            disabled={isSyncing}
            style={{
              fontSize: 12,
              fontWeight: 500,
              padding: '5px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              background: isSyncing ? 'var(--surface-hover)' : 'var(--surface)',
              color: isSyncing ? 'var(--text-tertiary)' : 'var(--text-secondary)',
              cursor: isSyncing ? 'not-allowed' : 'pointer',
              transition: 'all 200ms ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {isSyncing ? (
              <>
                <div
                  className="w-3 h-3 border-[1.5px] rounded-full animate-spin"
                  style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
                />
                Syncing...
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 4v6h-6" />
                  <path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                </svg>
                Sync Now
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <p style={{ fontSize: 13, color: 'var(--error, #ff3b30)', marginBottom: 12 }}>
          {error}
        </p>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }}
          />
        </div>
      ) : tweets.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 8 }}>
            No synced tweets yet.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
            Click &quot;Sync Now&quot; to pull your recent posts from X.
          </p>
        </div>
      ) : (
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--border) transparent',
          }}
        >
          {tweets.map((tweet) => (
            <TweetCard key={tweet.id} tweet={tweet} maxEngagement={maxEngagement} onRepurpose={handleRepurposeTweet} />
          ))}
        </div>
      )}

      {/* Repurpose Panel */}
      {repurposeSource && (
        <RepurposePanel
          source={repurposeSource}
          onClose={() => setRepurposeSource(null)}
          onSaveDraft={async (data) => {
            if (!brand?.id) return;
            try {
              await fetch('/api/calendar/drafts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  brandId: brand.id,
                  ...data,
                  sourceType: 'repurpose',
                  sourceId: repurposeSource.id,
                }),
              });
            } catch (err) {
              console.error('Failed to save repurposed draft:', err);
            }
          }}
        />
      )}
    </div>
  );
}
