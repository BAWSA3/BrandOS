import { features } from '@/lib/features';
import { internalHeaders } from '@/lib/internal-auth';
import type { TweetData, TweetAnalysisStats, ContentPatterns } from '@/lib/gemini';

export interface ScoringTweets {
  tweets: TweetData[];
  rawTweets: { id: string; text: string; created_at: string }[];
  stats: TweetAnalysisStats;
  contentPatterns: ContentPatterns;
}

/**
 * Fetch a creator's recent tweets for scoring, server-side via /api/x-tweets
 * (internal token: skips the public rate limit). Tweets are fetched here, never
 * taken from the client, so a scan can't be fed fake tweets to inflate a score.
 * /api/x-tweets caches by handle + maxResults, so matching the homepage's own
 * request size (50) reuses that fetch instead of paying SocialData twice.
 * Returns null when tweet analysis is off or the fetch fails.
 */
export async function fetchScoringTweets(
  username: string,
  origin: string,
  maxResults: number
): Promise<ScoringTweets | null> {
  if (!features.tweetAnalysis) {
    return null;
  }

  try {
    const response = await fetch(`${origin}/api/x-tweets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...internalHeaders() },
      body: JSON.stringify({ username, maxResults }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      if (error.upgradeRequired) {
        console.log('Tweet analysis requires X API Basic tier');
      }
      return null;
    }

    const data = await response.json();
    if (!Array.isArray(data.tweets) || data.tweets.length === 0) return null;

    return {
      tweets: data.tweets.map(
        (t: {
          text: string;
          created_at: string;
          public_metrics: {
            like_count: number;
            retweet_count: number;
            reply_count: number;
            impression_count?: number;
          };
        }) => ({
          text: t.text,
          created_at: t.created_at,
          likes: t.public_metrics?.like_count || 0,
          retweets: t.public_metrics?.retweet_count || 0,
          replies: t.public_metrics?.reply_count || 0,
          impressions: t.public_metrics?.impression_count,
        })
      ),
      rawTweets: data.tweets.map((t: { id: string; text: string; created_at: string }) => ({
        id: t.id,
        text: t.text,
        created_at: t.created_at,
      })),
      stats: data.analysis.stats,
      contentPatterns: data.analysis.contentPatterns,
    };
  } catch (error) {
    console.error('Tweets fetch error:', error);
    return null;
  }
}
