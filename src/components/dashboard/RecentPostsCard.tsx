'use client';

import type { DashboardPost } from '@/app/api/dashboard/posts/route';

interface RecentPostsCardProps {
  posts: DashboardPost[];
  isLoading: boolean;
}

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

function getMaxEngagement(posts: DashboardPost[]): number {
  if (posts.length === 0) return 1;
  return Math.max(
    ...posts.map(
      (p) =>
        p.public_metrics.like_count +
        p.public_metrics.retweet_count +
        p.public_metrics.reply_count
    ),
    1
  );
}

export default function RecentPostsCard({ posts, isLoading }: RecentPostsCardProps) {
  const maxEngagement = getMaxEngagement(posts);

  return (
    <div style={{ background: 'var(--surface)', borderRadius: 16, padding: 24, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
          Recent Posts
        </h3>
        {posts.length > 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
            {posts.length} posts
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
      ) : posts.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--text-tertiary)', padding: '24px 0', textAlign: 'center' }}>
          No recent posts found. Connect your X account or start creating content!
        </p>
      ) : (
        <div
          className="flex gap-3 overflow-x-auto pb-2"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: 'var(--border) transparent',
          }}
        >
          {posts.slice(0, 10).map((post) => {
            const totalEngagement =
              post.public_metrics.like_count +
              post.public_metrics.retweet_count +
              post.public_metrics.reply_count;
            const engagementRatio = totalEngagement / maxEngagement;

            return (
              <div
                key={post.id}
                className="shrink-0 flex flex-col justify-between"
                style={{
                  width: 240,
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
                {/* Post text */}
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
                  {post.text}
                </p>

                <div>
                  {/* Mini bar chart (relative performance) */}
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
                  <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
                    <span
                      className="flex items-center gap-1"
                      style={{ fontSize: 12, color: 'var(--text-secondary)' }}
                      title="Likes"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                      </svg>
                      {formatNumber(post.public_metrics.like_count)}
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
                      {formatNumber(post.public_metrics.retweet_count)}
                    </span>
                    <span
                      className="flex items-center gap-1"
                      style={{ fontSize: 12, color: 'var(--text-secondary)' }}
                      title="Replies"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                      </svg>
                      {formatNumber(post.public_metrics.reply_count)}
                    </span>
                    {post.public_metrics.impression_count > 0 && (
                      <span
                        className="flex items-center gap-1"
                        style={{ fontSize: 12, color: 'var(--text-tertiary)' }}
                        title="Views"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        {formatNumber(post.public_metrics.impression_count)}
                      </span>
                    )}
                  </div>

                  {/* Timestamp */}
                  <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {formatTimeAgo(post.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
