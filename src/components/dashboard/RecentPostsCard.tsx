'use client';

import { Heart, Repeat2, MessageCircle, Eye, Loader2 } from 'lucide-react';
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
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
}

export default function RecentPostsCard({ posts, isLoading }: RecentPostsCardProps) {
  // Find max engagement for relative bar sizing
  const maxEngagement = Math.max(
    ...posts.map(
      (p) =>
        p.public_metrics.like_count +
        p.public_metrics.retweet_count +
        p.public_metrics.reply_count
    ),
    1
  );

  return (
    <div
      className="col-span-3 rounded-2xl border p-5"
      style={{
        background: 'rgba(15, 15, 15, 0.85)',
        borderColor: 'rgba(255, 255, 255, 0.08)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-medium">
          Recent Posts
        </h3>
        {posts.length > 0 && (
          <span className="text-[10px] text-white/25">{posts.length} posts</span>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 text-white/20 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-3">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white/15">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </div>
          <p className="text-xs text-white/30">
            Connect your X account to see your recent posts
          </p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
          {posts.map((post) => {
            const engagement =
              post.public_metrics.like_count +
              post.public_metrics.retweet_count +
              post.public_metrics.reply_count;
            const barWidth = (engagement / maxEngagement) * 100;

            return (
              <div
                key={post.id}
                className="shrink-0 w-[260px] p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/10 transition-colors group"
              >
                {/* Text */}
                <p className="text-[12px] text-white/70 leading-relaxed line-clamp-3 mb-3 min-h-[48px]">
                  {post.text}
                </p>

                {/* Engagement bar */}
                <div className="h-1 bg-white/[0.04] rounded-full mb-3 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0047FF] to-[#00FF41]"
                    style={{ width: `${Math.max(barWidth, 5)}%` }}
                  />
                </div>

                {/* Metrics row */}
                <div className="flex items-center gap-3 text-[10px] text-white/30">
                  <span className="flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    {formatNumber(post.public_metrics.like_count)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Repeat2 className="w-3 h-3" />
                    {formatNumber(post.public_metrics.retweet_count)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    {formatNumber(post.public_metrics.reply_count)}
                  </span>
                  {post.public_metrics.impression_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {formatNumber(post.public_metrics.impression_count)}
                    </span>
                  )}
                  <span className="ml-auto text-white/20">
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
