// ===== YOUTUBE DATA SOURCE =====

import {
  YouTubeVideo,
  TCGVertical,
  VERTICAL_CONFIGS,
  SourceStatus,
} from '../research.types';

interface YouTubeSearchResponse {
  items?: {
    id: { videoId: string };
    snippet: {
      title: string;
      description: string;
      channelTitle: string;
      channelId: string;
      publishedAt: string;
      thumbnails: {
        high?: { url: string };
        medium?: { url: string };
        default?: { url: string };
      };
    };
  }[];
  pageInfo?: {
    totalResults: number;
  };
  error?: {
    message: string;
  };
}

interface YouTubeVideoStatsResponse {
  items?: {
    id: string;
    statistics: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
  }[];
}

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

/**
 * Get YouTube API key from environment
 */
function getApiKey(): string | null {
  return process.env.YOUTUBE_API_KEY || null;
}

/**
 * Check if YouTube API is available
 */
export async function getYouTubeStatus(): Promise<SourceStatus> {
  const apiKey = getApiKey();

  if (!apiKey) {
    return {
      source: 'youtube',
      enabled: false,
      apiStatus: 'down',
      lastChecked: new Date().toISOString(),
    };
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: 'test',
      maxResults: '1',
      key: apiKey,
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);

    if (response.ok) {
      return {
        source: 'youtube',
        enabled: true,
        apiStatus: 'healthy',
        lastChecked: new Date().toISOString(),
      };
    } else if (response.status === 403) {
      return {
        source: 'youtube',
        enabled: true,
        apiStatus: 'degraded',
        lastChecked: new Date().toISOString(),
      };
    } else {
      return {
        source: 'youtube',
        enabled: true,
        apiStatus: 'down',
        lastChecked: new Date().toISOString(),
      };
    }
  } catch {
    return {
      source: 'youtube',
      enabled: true,
      apiStatus: 'down',
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Search YouTube for videos
 */
async function searchYouTube(
  query: string,
  maxResults: number = 25,
  publishedAfter?: Date
): Promise<YouTubeVideo[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn('YouTube API: No API key configured');
    return [];
  }

  try {
    const params = new URLSearchParams({
      part: 'snippet',
      q: query,
      type: 'video',
      maxResults: Math.min(maxResults, 50).toString(),
      order: 'relevance',
      key: apiKey,
    });

    if (publishedAfter) {
      params.set('publishedAfter', publishedAfter.toISOString());
    }

    const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);

    if (!response.ok) {
      console.error(`YouTube API error: ${response.status}`);
      return [];
    }

    const data: YouTubeSearchResponse = await response.json();

    if (!data.items) {
      return [];
    }

    const videos: YouTubeVideo[] = data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      channelTitle: item.snippet.channelTitle,
      channelId: item.snippet.channelId,
      publishedAt: item.snippet.publishedAt,
      thumbnailUrl:
        item.snippet.thumbnails.high?.url ||
        item.snippet.thumbnails.medium?.url ||
        item.snippet.thumbnails.default?.url ||
        '',
    }));

    // Fetch video statistics in batch
    const videoIds = videos.map((v) => v.id);
    const stats = await fetchVideoStats(videoIds);

    // Merge stats into videos
    for (const video of videos) {
      const videoStats = stats[video.id];
      if (videoStats) {
        video.viewCount = videoStats.viewCount;
        video.likeCount = videoStats.likeCount;
        video.commentCount = videoStats.commentCount;
      }
    }

    return videos;
  } catch (error) {
    console.error('YouTube search error:', error);
    return [];
  }
}

/**
 * Fetch statistics for multiple videos
 */
async function fetchVideoStats(
  videoIds: string[]
): Promise<Record<string, { viewCount?: number; likeCount?: number; commentCount?: number }>> {
  const apiKey = getApiKey();
  if (!apiKey || videoIds.length === 0) return {};

  try {
    const params = new URLSearchParams({
      part: 'statistics',
      id: videoIds.join(','),
      key: apiKey,
    });

    const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);

    if (!response.ok) {
      return {};
    }

    const data: YouTubeVideoStatsResponse = await response.json();

    const stats: Record<string, { viewCount?: number; likeCount?: number; commentCount?: number }> = {};

    if (data.items) {
      for (const item of data.items) {
        stats[item.id] = {
          viewCount: item.statistics.viewCount ? parseInt(item.statistics.viewCount) : undefined,
          likeCount: item.statistics.likeCount ? parseInt(item.statistics.likeCount) : undefined,
          commentCount: item.statistics.commentCount ? parseInt(item.statistics.commentCount) : undefined,
        };
      }
    }

    return stats;
  } catch {
    return {};
  }
}

/**
 * Fetch videos for specific TCG verticals
 */
export async function fetchYouTubeForVerticals(
  verticals: TCGVertical[],
  videosPerVertical: number = 15,
  daysBack: number = 7
): Promise<{ vertical: TCGVertical; videos: YouTubeVideo[] }[]> {
  const results: { vertical: TCGVertical; videos: YouTubeVideo[] }[] = [];
  const publishedAfter = new Date();
  publishedAfter.setDate(publishedAfter.getDate() - daysBack);

  for (const vertical of verticals) {
    const config = VERTICAL_CONFIGS[vertical];
    if (!config) continue;

    // Build search query from channels and keywords
    const channelTerms = config.youtubeChannels.slice(0, 2).map((c) => `"${c}"`);
    const keywordTerms = config.keywords.slice(0, 3);
    const query = [...channelTerms, ...keywordTerms].join(' OR ');

    const videos = await searchYouTube(query, videosPerVertical, publishedAfter);
    results.push({ vertical, videos });

    // Small delay to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return results;
}

/**
 * Search YouTube for trending TCG content
 */
export async function searchYouTubeTrending(
  vertical: TCGVertical,
  additionalKeywords?: string[],
  maxResults: number = 25,
  daysBack: number = 7
): Promise<YouTubeVideo[]> {
  const config = VERTICAL_CONFIGS[vertical];
  if (!config) return [];

  const publishedAfter = new Date();
  publishedAfter.setDate(publishedAfter.getDate() - daysBack);

  const keywords = [
    config.name,
    ...config.keywords.slice(0, 2),
    ...(additionalKeywords || []),
  ];
  const query = keywords.join(' ');

  return searchYouTube(query, maxResults, publishedAfter);
}
