// =============================================================================
// CONTENT NORMALIZERS — Convert platform-specific data into ContentItem
// =============================================================================

import type { ContentItem, SocialPlatform, EngagementMetrics } from './types';

/**
 * Normalize an X/Twitter tweet into a ContentItem.
 */
export function normalizeTweet(tweet: {
  id: string;
  text: string;
  created_at: string;
  public_metrics?: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
    impression_count?: number;
    quote_count?: number;
  };
  entities?: {
    hashtags?: { tag: string }[];
    mentions?: { username: string }[];
    urls?: { expanded_url: string }[];
  };
  author?: { username?: string; name?: string };
}): ContentItem {
  const metrics = tweet.public_metrics;
  return {
    id: tweet.id,
    platform: 'x',
    contentType: 'text',
    textContent: tweet.text,
    metadata: {
      postedAt: tweet.created_at,
      engagement: {
        likes: metrics?.like_count ?? 0,
        comments: metrics?.reply_count ?? 0,
        shares: (metrics?.retweet_count ?? 0) + (metrics?.quote_count ?? 0),
        views: metrics?.impression_count,
      },
      hashtags: tweet.entities?.hashtags?.map((h) => h.tag) ?? [],
      mentions: tweet.entities?.mentions?.map((m) => m.username) ?? [],
      authorUsername: tweet.author?.username,
      authorDisplayName: tweet.author?.name,
    },
    rawData: tweet as unknown as Record<string, unknown>,
  };
}

/**
 * Normalize a LinkedIn post into a ContentItem.
 */
export function normalizeLinkedInPost(post: {
  id: string;
  text: string;
  createdAt: string;
  likeCount?: number;
  commentCount?: number;
  shareCount?: number;
  impressionCount?: number;
  mediaUrls?: string[];
  authorUsername?: string;
  authorDisplayName?: string;
}): ContentItem {
  const hasMedia = post.mediaUrls && post.mediaUrls.length > 0;
  return {
    id: post.id,
    platform: 'linkedin',
    contentType: hasMedia && post.mediaUrls!.length > 1 ? 'carousel' : hasMedia ? 'image' : 'text',
    textContent: post.text,
    mediaUrls: post.mediaUrls,
    metadata: {
      postedAt: post.createdAt,
      engagement: {
        likes: post.likeCount ?? 0,
        comments: post.commentCount ?? 0,
        shares: post.shareCount ?? 0,
        views: post.impressionCount,
      },
      hashtags: extractHashtags(post.text),
      mentions: extractMentions(post.text),
      authorUsername: post.authorUsername,
      authorDisplayName: post.authorDisplayName,
    },
  };
}

/**
 * Normalize an Instagram post into a ContentItem.
 */
export function normalizeInstagramPost(post: {
  id: string;
  caption?: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
  mediaUrl?: string;
  thumbnailUrl?: string;
  timestamp: string;
  likeCount?: number;
  commentsCount?: number;
  permalink?: string;
  children?: { mediaUrl: string }[];
  authorUsername?: string;
}): ContentItem {
  const typeMap: Record<string, ContentItem['contentType']> = {
    IMAGE: 'image',
    VIDEO: 'reel',
    CAROUSEL_ALBUM: 'carousel',
  };
  const urls: string[] = [];
  if (post.mediaUrl) urls.push(post.mediaUrl);
  if (post.children) urls.push(...post.children.map((c) => c.mediaUrl));

  return {
    id: post.id,
    platform: 'instagram',
    contentType: typeMap[post.mediaType] ?? 'image',
    textContent: post.caption,
    mediaUrls: urls.length > 0 ? urls : undefined,
    metadata: {
      postedAt: post.timestamp,
      engagement: {
        likes: post.likeCount ?? 0,
        comments: post.commentsCount ?? 0,
        shares: 0,
      },
      hashtags: post.caption ? extractHashtags(post.caption) : [],
      mentions: post.caption ? extractMentions(post.caption) : [],
      url: post.permalink,
      authorUsername: post.authorUsername,
    },
  };
}

/**
 * Normalize a YouTube video into a ContentItem.
 */
export function normalizeYouTubeVideo(video: {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl?: string;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  duration?: string;
  transcript?: string;
  channelTitle?: string;
}): ContentItem {
  return {
    id: video.id,
    platform: 'youtube',
    contentType: 'video',
    textContent: `${video.title}\n\n${video.description}`,
    transcript: video.transcript,
    mediaUrls: video.thumbnailUrl ? [video.thumbnailUrl] : undefined,
    metadata: {
      postedAt: video.publishedAt,
      engagement: {
        likes: video.likeCount ?? 0,
        comments: video.commentCount ?? 0,
        shares: 0,
        views: video.viewCount,
      },
      hashtags: extractHashtags(video.description),
      mentions: extractMentions(video.description),
      authorDisplayName: video.channelTitle,
    },
  };
}

/**
 * Normalize a TikTok video into a ContentItem.
 */
export function normalizeTikTokVideo(video: {
  id: string;
  description: string;
  createTime: number;
  diggCount?: number;
  commentCount?: number;
  shareCount?: number;
  playCount?: number;
  coverImageUrl?: string;
  transcript?: string;
  authorUsername?: string;
}): ContentItem {
  return {
    id: video.id,
    platform: 'tiktok',
    contentType: 'video',
    textContent: video.description,
    transcript: video.transcript,
    mediaUrls: video.coverImageUrl ? [video.coverImageUrl] : undefined,
    metadata: {
      postedAt: new Date(video.createTime * 1000).toISOString(),
      engagement: {
        likes: video.diggCount ?? 0,
        comments: video.commentCount ?? 0,
        shares: video.shareCount ?? 0,
        views: video.playCount,
      },
      hashtags: extractHashtags(video.description),
      mentions: extractMentions(video.description),
      authorUsername: video.authorUsername,
    },
  };
}

/**
 * Normalize a Threads post into a ContentItem.
 */
export function normalizeThreadsPost(post: {
  id: string;
  text?: string;
  timestamp: string;
  likeCount?: number;
  repliesCount?: number;
  mediaUrls?: string[];
  authorUsername?: string;
}): ContentItem {
  return {
    id: post.id,
    platform: 'threads',
    contentType: post.mediaUrls && post.mediaUrls.length > 0 ? 'image' : 'text',
    textContent: post.text,
    mediaUrls: post.mediaUrls,
    metadata: {
      postedAt: post.timestamp,
      engagement: {
        likes: post.likeCount ?? 0,
        comments: post.repliesCount ?? 0,
        shares: 0,
      },
      hashtags: post.text ? extractHashtags(post.text) : [],
      mentions: post.text ? extractMentions(post.text) : [],
      authorUsername: post.authorUsername,
    },
  };
}

/**
 * Create a ContentItem from manually pasted text (no platform API needed).
 */
export function normalizeManualInput(input: {
  text?: string;
  platform: SocialPlatform;
  contentType?: ContentItem['contentType'];
  mediaUrls?: string[];
  transcript?: string;
}): ContentItem {
  return {
    id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    platform: input.platform,
    contentType: input.contentType ?? 'text',
    textContent: input.text,
    transcript: input.transcript,
    mediaUrls: input.mediaUrls,
    metadata: {
      postedAt: new Date().toISOString(),
      engagement: { likes: 0, comments: 0, shares: 0 },
      hashtags: input.text ? extractHashtags(input.text) : [],
      mentions: input.text ? extractMentions(input.text) : [],
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────────

function extractHashtags(text: string): string[] {
  const matches = text.match(/#[\w\u0080-\uFFFF]+/g);
  return matches ? matches.map((h) => h.slice(1)) : [];
}

function extractMentions(text: string): string[] {
  const matches = text.match(/@[\w]+/g);
  return matches ? matches.map((m) => m.slice(1)) : [];
}

/**
 * Compute a platform-agnostic engagement rate from EngagementMetrics.
 * Returns a percentage (0-100).
 */
export function computeEngagementRate(metrics: EngagementMetrics): number {
  const totalEngagement = metrics.likes + metrics.comments + metrics.shares;
  const impressions = metrics.views ?? totalEngagement * 10; // rough fallback
  if (impressions === 0) return 0;
  return (totalEngagement / impressions) * 100;
}
