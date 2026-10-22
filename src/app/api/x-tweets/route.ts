import { NextRequest, NextResponse } from 'next/server';
import { fetchTweetsByUsername, fetchUserTweets, isSocialDataConfigured } from '@/lib/socialdata';
import { getClientIdentifier, checkRateLimit, rateLimiters } from '@/lib/rate-limit';
import { isInternalRequest } from '@/lib/internal-auth';
import { tweetsCache } from '@/lib/cache';
import { analyzeTweets, type Tweet, type TweetAnalysis } from '@/lib/tweet-analysis';

// Tweet fields we want to fetch (X API v2 fallback)
const TWEET_FIELDS = [
  'id',
  'text',
  'created_at',
  'public_metrics',
  'entities',
  'context_annotations',
  'conversation_id',
  'reply_settings',
].join(',');

export type { Tweet, TweetAnalysis } from '@/lib/tweet-analysis';

/**
 * Fetch recent tweets for a user
 * REQUIRES: X API Basic tier ($100/month)
 *
 * This endpoint will return 403 on Free tier
 */
export async function POST(request: NextRequest) {
  try {
    // First-party server routes send the internal token and skip the public
    // cap. Everyone else is rate-limited by IP — this endpoint pulls paid
    // third-party data, so an unthrottled public path is a cost-abuse vector.
    const internal = isInternalRequest(request);
    if (!internal) {
      const clientId = getClientIdentifier(request);
      const { limited, resetIn } = checkRateLimit(`${clientId}:x-tweets`, rateLimiters.ai);
      if (limited) {
        return NextResponse.json(
          { error: 'Too many requests. Please try again later.' },
          { status: 429, headers: { 'Retry-After': Math.ceil(resetIn / 1000).toString() } }
        );
      }
    }

    const {
      userId,
      username,
      maxResults = 100,
    } = (await request.json()) as {
      userId?: string;
      username?: string;
      maxResults?: number;
    };

    if (!userId && !username) {
      return NextResponse.json({ error: 'Either userId or username is required' }, { status: 400 });
    }

    // Cache by target + size — cuts repeat SocialData spend for hot handles
    // and absorbs scripted retries that slip under the rate limit.
    const cacheKey = `tweets:${(userId || username || '').toLowerCase()}:${maxResults}`;
    const cached = tweetsCache.get<{ tweets: Tweet[]; analysis: TweetAnalysis }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    let tweets: Tweet[] = [];

    // Try SocialData first (budget-friendly, no tier restrictions)
    if (isSocialDataConfigured()) {
      let sdResult;
      if (userId) {
        sdResult = await fetchUserTweets(userId, maxResults);
      } else if (username) {
        sdResult = await fetchTweetsByUsername(username, maxResults);
      }
      if (sdResult && sdResult.tweets.length > 0) {
        tweets = sdResult.tweets;
      } else if (sdResult?.error) {
        console.warn('[x-tweets] SocialData failed:', sdResult.error);
      }
    }

    // Fallback to X API if SocialData returned nothing
    if (tweets.length === 0) {
      const bearerToken = process.env.X_BEARER_TOKEN;
      if (!bearerToken) {
        return NextResponse.json({ error: 'No tweet provider configured' }, { status: 500 });
      }

      let targetUserId = userId;
      if (!targetUserId && username) {
        const userResponse = await fetch(
          `https://api.twitter.com/2/users/by/username/${username}`,
          {
            headers: { Authorization: `Bearer ${bearerToken}` },
          }
        );
        if (!userResponse.ok) {
          return NextResponse.json(
            { error: 'Failed to find user' },
            { status: userResponse.status }
          );
        }
        const userData = await userResponse.json();
        targetUserId = userData.data?.id;
      }

      if (!targetUserId) {
        return NextResponse.json({ error: 'Could not resolve user ID' }, { status: 400 });
      }

      const tweetsUrl = `https://api.twitter.com/2/users/${targetUserId}/tweets?max_results=${Math.min(maxResults, 100)}&tweet.fields=${TWEET_FIELDS}&exclude=replies,retweets`;
      const tweetsResponse = await fetch(tweetsUrl, {
        headers: { Authorization: `Bearer ${bearerToken}` },
      });

      if (!tweetsResponse.ok) {
        if (tweetsResponse.status === 403) {
          return NextResponse.json(
            {
              error:
                'Tweet access unavailable. Configure SOCIALDATA_API_KEY or upgrade X API tier.',
            },
            { status: 403 }
          );
        }
        return NextResponse.json(
          { error: 'Failed to fetch tweets' },
          { status: tweetsResponse.status }
        );
      }

      const tweetsData = await tweetsResponse.json();
      tweets = tweetsData.data || [];
    }

    // Analyze tweets
    const analysis = analyzeTweets(tweets);

    console.log('=== TWEETS FETCHED ===');
    console.log(`Tweets retrieved: ${tweets.length}`);
    console.log(`Avg engagement: ${analysis.stats.avgEngagementRate.toFixed(2)}%`);
    console.log('======================');

    const payload = { tweets, analysis };
    // Only cache real results — don't pin an empty payload for a hot handle
    // whose provider call briefly failed.
    if (tweets.length > 0) {
      tweetsCache.set(cacheKey, payload);
    }

    return NextResponse.json(payload);
  } catch (error) {
    console.error('X Tweets API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
