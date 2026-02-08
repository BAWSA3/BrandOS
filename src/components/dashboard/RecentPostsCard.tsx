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
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
}

export default function RecentPostsCard({ posts, isLoading }: RecentPostsCardProps) {
  return (
    <div style={{ background: '#1C1C1E', borderRadius: 16, padding: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#86868B', marginBottom: 16, letterSpacing: '-0.01em' }}>
        Recent Posts
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="w-5 h-5 border-2 rounded-full animate-spin"
            style={{ borderColor: '#2C2C2E', borderTopColor: '#0A84FF' }}
          />
        </div>
      ) : posts.length === 0 ? (
        <p style={{ fontSize: 14, color: '#48484A', padding: '24px 0', textAlign: 'center' }}>
          No recent posts found. Start creating content!
        </p>
      ) : (
        <div className="space-y-1">
          {posts.slice(0, 5).map((post) => (
            <div
              key={post.id}
              className="flex items-center gap-4 py-3 transition-colors"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
            >
              {/* Post text */}
              <p
                className="flex-1 min-w-0 truncate"
                style={{ fontSize: 14, color: '#F5F5F7' }}
              >
                {post.text}
              </p>

              {/* Metrics */}
              <div className="flex items-center gap-4 shrink-0">
                <span style={{ fontSize: 12, color: '#6E6E73' }} title="Likes">
                  {formatNumber(post.likes)}
                </span>
                <span style={{ fontSize: 12, color: '#6E6E73' }} title="Reposts">
                  {formatNumber(post.retweets)}
                </span>
                <span style={{ fontSize: 12, color: '#6E6E73' }} title="Replies">
                  {formatNumber(post.replies)}
                </span>
              </div>

              {/* Timestamp */}
              <span className="shrink-0" style={{ fontSize: 12, color: '#48484A', minWidth: 50, textAlign: 'right' }}>
                {formatTimeAgo(post.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
