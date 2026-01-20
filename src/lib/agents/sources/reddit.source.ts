// ===== REDDIT DATA SOURCE =====

import {
  RedditPost,
  TCGVertical,
  VERTICAL_CONFIGS,
  SourceStatus,
} from '../research.types';

interface RedditListingResponse {
  data: {
    children: {
      data: {
        id: string;
        title: string;
        selftext?: string;
        author: string;
        subreddit: string;
        created_utc: number;
        score: number;
        num_comments: number;
        url: string;
        permalink: string;
        is_self: boolean;
        link_flair_text?: string;
      };
    }[];
    after?: string;
  };
}

const REDDIT_BASE = 'https://www.reddit.com';

/**
 * Check if Reddit API is available
 */
export async function getRedditStatus(): Promise<SourceStatus> {
  try {
    const response = await fetch(`${REDDIT_BASE}/r/all/hot.json?limit=1`, {
      headers: {
        'User-Agent': 'BrandOS Research Agent/1.0',
      },
    });

    if (response.ok) {
      return {
        source: 'reddit',
        enabled: true,
        apiStatus: 'healthy',
        lastChecked: new Date().toISOString(),
      };
    } else if (response.status === 429) {
      return {
        source: 'reddit',
        enabled: true,
        apiStatus: 'degraded',
        lastChecked: new Date().toISOString(),
      };
    } else {
      return {
        source: 'reddit',
        enabled: true,
        apiStatus: 'down',
        lastChecked: new Date().toISOString(),
      };
    }
  } catch {
    return {
      source: 'reddit',
      enabled: true,
      apiStatus: 'down',
      lastChecked: new Date().toISOString(),
    };
  }
}

/**
 * Fetch posts from a subreddit
 */
async function fetchSubreddit(
  subreddit: string,
  sort: 'hot' | 'top' | 'new' = 'hot',
  limit: number = 25,
  timeframe: 'day' | 'week' | 'month' = 'week'
): Promise<RedditPost[]> {
  try {
    const params = new URLSearchParams({
      limit: limit.toString(),
      t: timeframe,
    });

    const response = await fetch(
      `${REDDIT_BASE}/r/${subreddit}/${sort}.json?${params}`,
      {
        headers: {
          'User-Agent': 'BrandOS Research Agent/1.0',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.warn(`Reddit API: Rate limited on r/${subreddit}`);
      } else {
        console.error(`Reddit API error on r/${subreddit}: ${response.status}`);
      }
      return [];
    }

    const data: RedditListingResponse = await response.json();

    return data.data.children.map((child) => ({
      id: child.data.id,
      title: child.data.title,
      selftext: child.data.selftext || undefined,
      author: child.data.author,
      subreddit: child.data.subreddit,
      createdAt: new Date(child.data.created_utc * 1000).toISOString(),
      score: child.data.score,
      numComments: child.data.num_comments,
      url: child.data.url,
      permalink: `https://reddit.com${child.data.permalink}`,
    }));
  } catch (error) {
    console.error(`Reddit fetch error for r/${subreddit}:`, error);
    return [];
  }
}

/**
 * Search Reddit for posts matching a query
 */
async function searchReddit(
  query: string,
  subreddits?: string[],
  limit: number = 25,
  timeframe: 'day' | 'week' | 'month' = 'week'
): Promise<RedditPost[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      sort: 'relevance',
      t: timeframe,
      limit: limit.toString(),
    });

    // If subreddits specified, restrict search
    if (subreddits?.length) {
      params.set('restrict_sr', 'on');
    }

    const subredditPath = subreddits?.length
      ? `r/${subreddits.join('+')}`
      : 'r/all';

    const response = await fetch(
      `${REDDIT_BASE}/${subredditPath}/search.json?${params}`,
      {
        headers: {
          'User-Agent': 'BrandOS Research Agent/1.0',
        },
      }
    );

    if (!response.ok) {
      console.error(`Reddit search error: ${response.status}`);
      return [];
    }

    const data: RedditListingResponse = await response.json();

    return data.data.children.map((child) => ({
      id: child.data.id,
      title: child.data.title,
      selftext: child.data.selftext || undefined,
      author: child.data.author,
      subreddit: child.data.subreddit,
      createdAt: new Date(child.data.created_utc * 1000).toISOString(),
      score: child.data.score,
      numComments: child.data.num_comments,
      url: child.data.url,
      permalink: `https://reddit.com${child.data.permalink}`,
    }));
  } catch (error) {
    console.error('Reddit search error:', error);
    return [];
  }
}

/**
 * Fetch trending posts for specific TCG verticals
 */
export async function fetchRedditForVerticals(
  verticals: TCGVertical[],
  postsPerSubreddit: number = 15,
  sort: 'hot' | 'top' | 'new' = 'hot',
  timeframe: 'day' | 'week' | 'month' = 'week'
): Promise<{ vertical: TCGVertical; posts: RedditPost[] }[]> {
  const results: { vertical: TCGVertical; posts: RedditPost[] }[] = [];

  for (const vertical of verticals) {
    const config = VERTICAL_CONFIGS[vertical];
    if (!config?.subreddits.length) continue;

    const allPosts: RedditPost[] = [];

    // Fetch from each configured subreddit
    for (const subreddit of config.subreddits.slice(0, 3)) {
      const posts = await fetchSubreddit(subreddit, sort, postsPerSubreddit, timeframe);
      allPosts.push(...posts);

      // Small delay to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Sort by score and dedupe
    const uniquePosts = Array.from(
      new Map(allPosts.map((p) => [p.id, p])).values()
    ).sort((a, b) => b.score - a.score);

    results.push({ vertical, posts: uniquePosts });
  }

  return results;
}

/**
 * Search Reddit for specific keywords across verticals
 */
export async function searchRedditForKeywords(
  vertical: TCGVertical,
  additionalKeywords?: string[],
  limit: number = 25,
  timeframe: 'day' | 'week' | 'month' = 'week'
): Promise<RedditPost[]> {
  const config = VERTICAL_CONFIGS[vertical];
  if (!config) return [];

  const keywords = [...config.keywords.slice(0, 3), ...(additionalKeywords || [])];
  const query = keywords.join(' OR ');

  return searchReddit(query, config.subreddits, limit, timeframe);
}
