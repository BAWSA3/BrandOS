/**
 * SocialData.tools API Client
 *
 * Primary provider for all Twitter/X data fetching.
 * Pay-per-use (~$0.0002/request) with no daily caps.
 *
 * API returns Twitter v1.1-style JSON — we map it to our internal interfaces.
 */

const SOCIALDATA_BASE = 'https://api.socialdata.tools';

function getApiKey(): string | null {
  return process.env.SOCIALDATA_API_KEY || null;
}

async function socialDataFetch(path: string): Promise<Response> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('SOCIALDATA_API_KEY not configured');

  return fetch(`${SOCIALDATA_BASE}${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });
}

// ---------------------------------------------------------------------------
// Types — match existing XProfile and Tweet interfaces used across the app
// ---------------------------------------------------------------------------

export interface SocialDataProfile {
  id: string;
  name: string;
  username: string;
  description: string;
  profile_image_url: string;
  public_metrics: {
    followers_count: number;
    following_count: number;
    tweet_count: number;
    listed_count: number;
  };
  created_at: string;
  verified: boolean;
  location?: string;
  url?: string;
  protected: boolean;
}

export interface SocialDataTweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    impression_count: number;
  };
  entities?: {
    hashtags?: { tag: string }[];
    mentions?: { username: string }[];
    urls?: { expanded_url: string }[];
  };
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

export async function fetchProfile(
  username: string
): Promise<{ profile?: SocialDataProfile; status: number; error?: string }> {
  try {
    const response = await socialDataFetch(`/twitter/user/${encodeURIComponent(username)}`);
    console.log(`[SOCIALDATA] profile @${username} -> ${response.status}`);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error(`[SOCIALDATA ERROR] ${response.status} @${username}:`, JSON.stringify(err));
      if (response.status === 404 || response.status === 400) {
        return { status: 404, error: `User @${username} not found on X` };
      }
      return { status: response.status, error: `SocialData error (${response.status})` };
    }

    const data = await response.json();
    if (!data || !data.id_str) {
      return { status: 404, error: `User @${username} not found on X` };
    }

    return {
      status: 200,
      profile: {
        id: data.id_str,
        name: data.name || '',
        username: data.screen_name || username,
        description: data.description || '',
        profile_image_url: (data.profile_image_url_https || '').replace('_normal', '_400x400'),
        public_metrics: {
          followers_count: data.followers_count || 0,
          following_count: data.friends_count || 0,
          tweet_count: data.statuses_count || 0,
          listed_count: data.listed_count || 0,
        },
        created_at: data.created_at || '',
        verified: data.verified || false,
        location: data.location || undefined,
        url: data.url || undefined,
        protected: data.protected || false,
      },
    };
  } catch (error) {
    console.error('[SOCIALDATA] Profile fetch error:', error);
    return { status: 500, error: 'SocialData request failed' };
  }
}

// ---------------------------------------------------------------------------
// User Tweets (timeline)
// ---------------------------------------------------------------------------

/**
 * Map a single SocialData v1.1 tweet to our internal format.
 */
function mapTweet(raw: Record<string, unknown>): SocialDataTweet {
  const fullText = (raw.full_text || raw.text || '') as string;
  const createdAt = raw.created_at as string || '';

  // v1.1 metrics
  const likeCount = (raw.favorite_count as number) || 0;
  const retweetCount = (raw.retweet_count as number) || 0;
  const replyCount = (raw.reply_count as number) || 0;
  const quoteCount = (raw.quote_count as number) || 0;
  // SocialData may include bookmark/view counts on some endpoints
  const viewsObj = raw.ext_views as Record<string, unknown> | undefined;
  const impressionCount = (viewsObj?.count as number) || 0;

  // Entities mapping
  const rawEntities = raw.entities as Record<string, Record<string, unknown>[]> | undefined;
  let entities: SocialDataTweet['entities'] = undefined;
  if (rawEntities) {
    entities = {
      hashtags: (rawEntities.hashtags || []).map((h) => ({
        tag: (h.text as string) || '',
      })),
      mentions: (rawEntities.user_mentions || []).map((m) => ({
        username: (m.screen_name as string) || '',
      })),
      urls: (rawEntities.urls || []).map((u) => ({
        expanded_url: (u.expanded_url as string) || '',
      })),
    };
  }

  return {
    id: (raw.id_str as string) || String(raw.id || ''),
    text: fullText,
    created_at: createdAt,
    public_metrics: {
      like_count: likeCount,
      retweet_count: retweetCount,
      reply_count: replyCount,
      quote_count: quoteCount,
      impression_count: impressionCount,
    },
    entities,
  };
}

/**
 * Fetch a user's recent tweets via SocialData.
 * Uses the user timeline endpoint.
 */
export async function fetchUserTweets(
  userId: string,
  maxResults: number = 20
): Promise<{ tweets: SocialDataTweet[]; error?: string }> {
  try {
    const response = await socialDataFetch(
      `/twitter/user/${encodeURIComponent(userId)}/tweets?count=${Math.min(maxResults, 200)}`
    );
    console.log(`[SOCIALDATA] tweets for user ${userId} -> ${response.status}`);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      console.error(`[SOCIALDATA ERROR] tweets ${response.status}:`, JSON.stringify(err));
      return { tweets: [], error: `SocialData error (${response.status})` };
    }

    const data = await response.json();
    const rawTweets: Record<string, unknown>[] = data.tweets || data || [];

    if (!Array.isArray(rawTweets)) {
      return { tweets: [], error: 'Unexpected response format' };
    }

    // Filter out retweets and replies, map to our format
    const tweets = rawTweets
      .filter((t) => {
        const isRetweet = !!(t.retweeted_status || (t.full_text as string || '').startsWith('RT @'));
        const isReply = !!(t.in_reply_to_status_id_str || t.in_reply_to_status_id);
        return !isRetweet && !isReply;
      })
      .slice(0, maxResults)
      .map(mapTweet);

    return { tweets };
  } catch (error) {
    console.error('[SOCIALDATA] Tweet fetch error:', error);
    return { tweets: [], error: 'SocialData request failed' };
  }
}

/**
 * Fetch tweets by username (resolves user ID first via profile lookup).
 */
export async function fetchTweetsByUsername(
  username: string,
  maxResults: number = 20
): Promise<{ tweets: SocialDataTweet[]; userId?: string; error?: string }> {
  // First get user ID from profile
  const profileResult = await fetchProfile(username);
  if (!profileResult.profile) {
    return { tweets: [], error: profileResult.error || 'User not found' };
  }

  const result = await fetchUserTweets(profileResult.profile.id, maxResults);
  return { ...result, userId: profileResult.profile.id };
}

// ---------------------------------------------------------------------------
// Tweet Search
// ---------------------------------------------------------------------------

export interface SocialDataSearchResult extends SocialDataTweet {
  author_id?: string;
  author_username?: string;
}

/**
 * Search recent tweets via SocialData.
 */
export async function searchTweets(
  query: string,
  maxResults: number = 20
): Promise<SocialDataSearchResult[]> {
  try {
    const params = new URLSearchParams({
      query,
      type: 'Latest',
    });

    const response = await socialDataFetch(`/twitter/search?${params}`);
    console.log(`[SOCIALDATA] search "${query.slice(0, 40)}" -> ${response.status}`);

    if (!response.ok) {
      console.error(`[SOCIALDATA ERROR] search ${response.status}`);
      return [];
    }

    const data = await response.json();
    const rawTweets: Record<string, unknown>[] = data.tweets || data || [];

    if (!Array.isArray(rawTweets)) return [];

    return rawTweets.slice(0, maxResults).map((raw) => {
      const tweet = mapTweet(raw);
      const user = raw.user as Record<string, unknown> | undefined;
      return {
        ...tweet,
        author_id: user ? ((user.id_str as string) || String(user.id || '')) : undefined,
        author_username: user ? (user.screen_name as string) : undefined,
      };
    });
  } catch (error) {
    console.error('[SOCIALDATA] Search error:', error);
    return [];
  }
}

/**
 * Check if SocialData is configured and available.
 */
export function isSocialDataConfigured(): boolean {
  return !!process.env.SOCIALDATA_API_KEY;
}
