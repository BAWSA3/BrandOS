// ===== SOURCE AGGREGATOR & REGISTRY =====

import {
  TCGVertical,
  ResearchSource,
  RawSourceData,
  SourceStatus,
  TrendingPeriod,
  TwitterPost,
  RedditPost,
  YouTubeVideo,
  SerperResult,
} from '../research.types';

import {
  fetchTwitterForVerticals,
  fetchInfluencerPosts,
  getTwitterStatus,
} from './twitter.source';

import {
  fetchRedditForVerticals,
  searchRedditForKeywords,
  getRedditStatus,
} from './reddit.source';

import {
  fetchYouTubeForVerticals,
  searchYouTubeTrending,
  getYouTubeStatus,
} from './youtube.source';

import {
  fetchSerperForVerticals,
  searchTCGNews,
  getSerperStatus,
} from './serper.source';

// ===== SOURCE REGISTRY =====

export const SOURCE_REGISTRY: Record<ResearchSource, {
  name: string;
  description: string;
  rateLimit: string;
  requiredEnvVar: string;
}> = {
  twitter: {
    name: 'X/Twitter',
    description: 'Trending posts, hashtags, and influencer content',
    rateLimit: '10K tweets/month (Basic tier)',
    requiredEnvVar: 'X_BEARER_TOKEN',
  },
  reddit: {
    name: 'Reddit',
    description: 'Subreddit posts, discussions, and community sentiment',
    rateLimit: '60 requests/minute (free)',
    requiredEnvVar: '', // No API key required for public JSON
  },
  youtube: {
    name: 'YouTube',
    description: 'Video content from TCG channels',
    rateLimit: '10K units/day (free tier)',
    requiredEnvVar: 'YOUTUBE_API_KEY',
  },
  serper: {
    name: 'Google Search (Serper)',
    description: 'Web search and news articles',
    rateLimit: '2,500 searches/month (free tier)',
    requiredEnvVar: 'SERPER_API_KEY',
  },
};

// ===== STATUS FUNCTIONS =====

/**
 * Get status of all data sources
 */
export async function getAllSourceStatuses(): Promise<SourceStatus[]> {
  const [twitter, reddit, youtube, serper] = await Promise.all([
    getTwitterStatus(),
    getRedditStatus(),
    getYouTubeStatus(),
    getSerperStatus(),
  ]);

  return [twitter, reddit, youtube, serper];
}

/**
 * Get status of specific sources
 */
export async function getSourceStatuses(
  sources: ResearchSource[]
): Promise<SourceStatus[]> {
  const statusPromises = sources.map((source) => {
    switch (source) {
      case 'twitter':
        return getTwitterStatus();
      case 'reddit':
        return getRedditStatus();
      case 'youtube':
        return getYouTubeStatus();
      case 'serper':
        return getSerperStatus();
    }
  });

  return Promise.all(statusPromises);
}

// ===== AGGREGATION FUNCTIONS =====

interface AggregationOptions {
  verticals: TCGVertical[];
  sources: ResearchSource[];
  timeRange: TrendingPeriod;
  postsPerSource?: number;
}

/**
 * Map trending period to days
 */
function periodToDays(period: TrendingPeriod): number {
  switch (period) {
    case 'last-24h':
      return 1;
    case 'last-week':
      return 7;
    case 'last-month':
      return 30;
  }
}

/**
 * Map trending period to Reddit timeframe
 */
function periodToRedditTimeframe(period: TrendingPeriod): 'day' | 'week' | 'month' {
  switch (period) {
    case 'last-24h':
      return 'day';
    case 'last-week':
      return 'week';
    case 'last-month':
      return 'month';
  }
}

/**
 * Aggregate data from all specified sources for given verticals
 */
export async function aggregateFromSources(
  options: AggregationOptions
): Promise<RawSourceData> {
  const { verticals, sources, timeRange, postsPerSource = 25 } = options;
  const errors: { source: ResearchSource; error: string }[] = [];

  const result: RawSourceData = {
    fetchedAt: new Date().toISOString(),
  };

  // Fetch from each source in parallel where possible
  const fetchPromises: Promise<void>[] = [];

  // Twitter
  if (sources.includes('twitter')) {
    fetchPromises.push(
      (async () => {
        try {
          const twitterData = await fetchTwitterForVerticals(verticals, postsPerSource);
          const allPosts: TwitterPost[] = [];
          for (const { posts } of twitterData) {
            allPosts.push(...posts);
          }

          // Also fetch influencer posts
          for (const vertical of verticals) {
            const influencerPosts = await fetchInfluencerPosts(vertical, 10);
            allPosts.push(...influencerPosts);
          }

          result.twitter = allPosts;
        } catch (error) {
          errors.push({
            source: 'twitter',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      })()
    );
  }

  // Reddit
  if (sources.includes('reddit')) {
    fetchPromises.push(
      (async () => {
        try {
          const redditData = await fetchRedditForVerticals(
            verticals,
            postsPerSource,
            'hot',
            periodToRedditTimeframe(timeRange)
          );
          const allPosts: RedditPost[] = [];
          for (const { posts } of redditData) {
            allPosts.push(...posts);
          }
          result.reddit = allPosts;
        } catch (error) {
          errors.push({
            source: 'reddit',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      })()
    );
  }

  // YouTube
  if (sources.includes('youtube')) {
    fetchPromises.push(
      (async () => {
        try {
          const daysBack = periodToDays(timeRange);
          const youtubeData = await fetchYouTubeForVerticals(
            verticals,
            postsPerSource,
            daysBack
          );
          const allVideos: YouTubeVideo[] = [];
          for (const { videos } of youtubeData) {
            allVideos.push(...videos);
          }
          result.youtube = allVideos;
        } catch (error) {
          errors.push({
            source: 'youtube',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      })()
    );
  }

  // Serper
  if (sources.includes('serper')) {
    fetchPromises.push(
      (async () => {
        try {
          const serperData = await fetchSerperForVerticals(
            verticals,
            postsPerSource,
            'news'
          );
          const allResults: SerperResult[] = [];
          for (const { results } of serperData) {
            allResults.push(...results);
          }
          result.serper = allResults;
        } catch (error) {
          errors.push({
            source: 'serper',
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      })()
    );
  }

  // Wait for all fetches to complete
  await Promise.all(fetchPromises);

  if (errors.length > 0) {
    result.errors = errors;
  }

  return result;
}

/**
 * Get available sources (those with valid API keys)
 */
export async function getAvailableSources(): Promise<ResearchSource[]> {
  const statuses = await getAllSourceStatuses();
  return statuses
    .filter((s) => s.enabled && s.apiStatus !== 'down')
    .map((s) => s.source);
}

// ===== EXPORTS =====

export {
  fetchTwitterForVerticals,
  fetchInfluencerPosts,
  getTwitterStatus,
} from './twitter.source';

export {
  fetchRedditForVerticals,
  searchRedditForKeywords,
  getRedditStatus,
} from './reddit.source';

export {
  fetchYouTubeForVerticals,
  searchYouTubeTrending,
  getYouTubeStatus,
} from './youtube.source';

export {
  fetchSerperForVerticals,
  searchTCGNews,
  getSerperStatus,
} from './serper.source';
