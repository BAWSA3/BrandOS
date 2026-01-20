// ===== TWITTER/X DATA SOURCE =====

import {
  TwitterPost,
  TCGVertical,
  VERTICAL_CONFIGS,
  SourceStatus,
} from '../research.types';

interface TwitterSearchResponse {
  data?: {
    id: string;
    text: string;
    created_at: string;
    author_id: string;
    public_metrics?: {
      retweet_count: number;
      reply_count: number;
      like_count: number;
      impression_count?: number;
    };
    entities?: {
      hashtags?: { tag: string }[];
      urls?: { expanded_url: string }[];
    };
  }[];
  includes?: {
    users?: {
      id: string;
      username: string;
      name: string;
    }[];
  };
  meta?: {
    result_count: number;
    next_token?: string;
  };
  errors?: { message: string }[];
}

const TWITTER_API_BASE = 'https://api.twitter.com/2';

/**
 * Get the X/Twitter bearer token from environment
 */
function getBearerToken(): string | null {
  return process.env.X_BEARER_TOKEN || null;
}

/**
 * Check if Twitter API is available and healthy
 */
export async function getTwitterStatus(): Promise<SourceStatus> {
  const token = getBearerToken();

  if (!token) {
    return {
      source: 'twitter',
      enabled: false,
      apiStatus: 'down',
      lastChecked: new Date().toISOString(),
    };
  }

  try {
    // Simple rate limit check endpoint
    const response = await fetch(`${TWITTER_API_BASE}/tweets/search/recent?query=test&max_results=10`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const rateLimitRemaining = response.headers.get('x-rate-limit-remaining');
    const rateLimitReset = response.headers.get('x-rate-limit-reset');

    if (response.status === 200) {
      return {
        source: 'twitter',
        enabled: true,
        apiStatus: 'healthy',
        lastChecked: new Date().toISOString(),
        rateLimitRemaining: rateLimitRemaining ? parseInt(rateLimitRemaining) : undefined,
        rateLimitReset: rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toISOString() : undefined,
      };
    } else if (response.status === 429) {
      return {
        source: 'twitter',
        enabled: true,
        apiStatus: 'degraded',
        lastChecked: new Date().toISOString(),
        rateLimitRemaining: 0,
        rateLimitReset: rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000).toISOString() : undefined,
      };
    } else {
      return {
        source: 'twitter',
        enabled: true,
        apiStatus: 'degraded',
        lastChecked: new Date().toISOString(),
      };
    }
  } catch {
    return {
      source: 'twitter',
      enabled: true,
      apiStatus: 'down',
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Search Twitter for posts matching a query
 */
async function searchTwitter(
  query: string,
  maxResults: number = 50
): Promise<TwitterPost[]> {
  const token = getBearerToken();
  if (!token) {
    console.warn('Twitter API: No bearer token configured');
    return [];
  }

  try {
    const params = new URLSearchParams({
      query: `${query} -is:retweet lang:en`,
      max_results: Math.min(maxResults, 100).toString(),
      'tweet.fields': 'created_at,public_metrics,entities,author_id',
      'user.fields': 'username,name',
      expansions: 'author_id',
    });

    const response = await fetch(
      `${TWITTER_API_BASE}/tweets/search/recent?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('Twitter API: Rate limit exceeded');
      } else {
        console.error(`Twitter API error: ${response.status}`);
      }
      return [];
    }

    const data: TwitterSearchResponse = await response.json();

    if (!data.data) {
      return [];
    }

    // Build user lookup map
    const userMap = new Map<string, { username: string; name: string }>();
    if (data.includes?.users) {
      for (const user of data.includes.users) {
        userMap.set(user.id, { username: user.username, name: user.name });
      }
    }

    // Transform to TwitterPost format
    return data.data.map((tweet) => {
      const user = userMap.get(tweet.author_id) || { username: 'unknown', name: 'Unknown' };
      return {
        id: tweet.id,
        text: tweet.text,
        authorUsername: user.username,
        authorName: user.name,
        createdAt: tweet.created_at,
        metrics: {
          likes: tweet.public_metrics?.like_count || 0,
          retweets: tweet.public_metrics?.retweet_count || 0,
          replies: tweet.public_metrics?.reply_count || 0,
          impressions: tweet.public_metrics?.impression_count,
        },
        hashtags: tweet.entities?.hashtags?.map((h) => h.tag) || [],
        urls: tweet.entities?.urls?.map((u) => u.expanded_url) || [],
      };
    });
  } catch (error) {
    console.error('Twitter API fetch error:', error);
    return [];
  }
}

/**
 * Fetch trending posts for specific TCG verticals
 */
export async function fetchTwitterForVerticals(
  verticals: TCGVertical[],
  postsPerVertical: number = 25
): Promise<{ vertical: TCGVertical; posts: TwitterPost[] }[]> {
  const results: { vertical: TCGVertical; posts: TwitterPost[] }[] = [];

  for (const vertical of verticals) {
    const config = VERTICAL_CONFIGS[vertical];
    if (!config) continue;

    // Build query from hashtags and keywords
    const hashtagQuery = config.hashtags.slice(0, 3).join(' OR ');
    const keywordQuery = config.keywords.slice(0, 2).join(' OR ');
    const query = `(${hashtagQuery}) OR (${keywordQuery})`;

    const posts = await searchTwitter(query, postsPerVertical);
    results.push({ vertical, posts });

    // Small delay to respect rate limits
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  return results;
}

/**
 * Fetch posts from specific influencer accounts
 */
export async function fetchInfluencerPosts(
  vertical: TCGVertical,
  maxPosts: number = 20
): Promise<TwitterPost[]> {
  const config = VERTICAL_CONFIGS[vertical];
  if (!config?.influencers.length) return [];

  // Search for posts from influencers
  const influencerQuery = config.influencers
    .slice(0, 3)
    .map((handle) => `from:${handle}`)
    .join(' OR ');

  return searchTwitter(influencerQuery, maxPosts);
}
