/**
 * Stats over a creator's recent original posts: what the brand score prompt
 * and the dashboard read. Pure (no network), so `npm run test:scan` covers it.
 *
 * Fixed Oct 2026 (the numbers fed every brand read):
 * - media is read from the post's media entities (it used to look for
 *   pic.twitter urls, so every account read "zero media")
 * - posting frequency uses the real time span of the sample (a pinned post at
 *   the top made the span negative, so every account read "5+ per day")
 * - engagement rate only counts posts that have view counts, includes quotes,
 *   and says when views are missing instead of reporting 0%
 * - emoji share uses a non-global regex (the /g flag carried lastIndex between
 *   posts and skipped matches)
 *
 * Oct 27: engagement rate is the median post's rate, not total engagements ÷
 * total views. Pooled, one viral post (127K views on a 1.7K account) carried
 * the whole rate; the outlier is now reported separately.
 */

import { isArticlePost } from '@/lib/post-formats';

export interface Tweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    impression_count?: number;
    bookmark_count?: number;
  };
  entities?: {
    hashtags?: { tag: string }[];
    mentions?: { username: string }[];
    urls?: { expanded_url: string }[];
  };
  /** Attached media types; undefined when the provider didn't say. */
  media?: string[];
  is_quote?: boolean;
}

export interface EngagementOutlier {
  tweetId: string;
  views: number;
  /** Views ÷ the median post's views, e.g. 70 for "70× your usual". */
  multiple: number;
  /** That post's own engagement rate (%). */
  rate: number;
  excerpt: string;
}

/** A post is called out when it did at least this many times the median views. */
export const OUTLIER_MULTIPLE = 5;

export function median(values: number[]): number {
  if (!values.length) return 0;
  const v = [...values].sort((a, b) => a - b);
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

export interface TweetAnalysis {
  tweets: Tweet[];
  stats: {
    totalTweets: number;
    /**
     * The typical post's engagement: the median of each post's
     * (likes + reposts + replies + quotes) ÷ views, as a %. 0 when unknown.
     */
    avgEngagementRate: number;
    /** False when no post in the sample had a view count. */
    engagementRateKnown: boolean;
    /** Total engagements ÷ total views (%); one viral post can dominate it. */
    pooledEngagementRate: number;
    /** Median views per post (posts with a view count), 0 when unknown. */
    medianViews: number;
    /** The post that did far more than usual (≥ OUTLIER_MULTIPLE × median views), if any. */
    outlier: EngagementOutlier | null;
    avgLikes: number;
    avgRetweets: number;
    avgReplies: number;
    topHashtags: string[];
    postingFrequency: string;
    /** Original posts per day over the sample's time span. */
    postsPerDay: number;
    /** Days between the oldest and newest post in the sample. */
    sampleDays: number;
    mostActiveHour: number;
    mostActiveDay: string;
  };
  contentPatterns: {
    avgTweetLength: number;
    emojiUsage: number;
    questionTweets: number;
    threadStarters: number;
    /** Posts that publish an X Article (long-form, like threads). */
    articles: number;
    /** Posts with at least one photo / video / gif. */
    mediaUsage: number;
  };
}

const DAY_MS = 86_400_000;
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// no /g: a global regex keeps lastIndex across .test() calls and skips matches
const EMOJI =
  /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{1F900}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;

export function frequencyLabel(perDay: number): string {
  if (perDay >= 5) return 'Very Active (5+ per day)';
  if (perDay >= 2) return 'Active (2-5 per day)';
  if (perDay >= 1) return 'Regular (1-2 per day)';
  if (perDay >= 0.3) return 'Moderate (few per week)';
  return 'Occasional (weekly or less)';
}

function hasMedia(t: Tweet): boolean {
  if (t.media) return t.media.length > 0;
  // X API fallback posts carry no media list; the url check is all we have
  return !!t.entities?.urls?.some(
    (u) => u.expanded_url.includes('pic.twitter') || u.expanded_url.includes('video.twimg')
  );
}

export function analyzeTweets(tweets: Tweet[]): TweetAnalysis {
  if (tweets.length === 0) {
    return {
      tweets: [],
      stats: {
        totalTweets: 0,
        avgEngagementRate: 0,
        engagementRateKnown: false,
        pooledEngagementRate: 0,
        medianViews: 0,
        outlier: null,
        avgLikes: 0,
        avgRetweets: 0,
        avgReplies: 0,
        topHashtags: [],
        postingFrequency: 'Unknown',
        postsPerDay: 0,
        sampleDays: 0,
        mostActiveHour: 0,
        mostActiveDay: 'Unknown',
      },
      contentPatterns: {
        avgTweetLength: 0,
        emojiUsage: 0,
        questionTweets: 0,
        threadStarters: 0,
        articles: 0,
        mediaUsage: 0,
      },
    };
  }

  const n = tweets.length;
  const m = (t: Tweet) => t.public_metrics;
  const sum = (f: (t: Tweet) => number, list = tweets) => list.reduce((a, t) => a + f(t), 0);

  const avgLikes = sum((t) => m(t)?.like_count || 0) / n;
  const avgRetweets = sum((t) => m(t)?.retweet_count || 0) / n;
  const avgReplies = sum((t) => m(t)?.reply_count || 0) / n;

  // Engagement rate over posts that have views only (mixing in view-less posts
  // deflated it, and no views at all used to read as 0%)
  const viewed = tweets.filter((t) => (m(t)?.impression_count || 0) > 0);
  const engagementOf = (t: Tweet) =>
    (m(t)?.like_count || 0) +
    (m(t)?.retweet_count || 0) +
    (m(t)?.reply_count || 0) +
    (m(t)?.quote_count || 0);
  const viewsOf = (t: Tweet) => m(t)?.impression_count || 0;
  const views = sum(viewsOf, viewed);
  const engaged = sum(engagementOf, viewed);
  const engagementRateKnown = views > 0;
  const pooledEngagementRate = engagementRateKnown ? (engaged / views) * 100 : 0;
  // The typical post, not the sum: a single viral post can't carry the rate
  const avgEngagementRate = engagementRateKnown
    ? median(viewed.map((t) => (engagementOf(t) / viewsOf(t)) * 100))
    : 0;
  const medianViews = median(viewed.map(viewsOf));
  let outlier: EngagementOutlier | null = null;
  if (viewed.length >= 5 && medianViews > 0) {
    const top = viewed.reduce((a, t) => (viewsOf(t) > viewsOf(a) ? t : a));
    const multiple = viewsOf(top) / medianViews;
    if (multiple >= OUTLIER_MULTIPLE) {
      outlier = {
        tweetId: top.id,
        views: viewsOf(top),
        multiple: Math.round(multiple),
        rate: (engagementOf(top) / viewsOf(top)) * 100,
        excerpt: top.text.replace(/\s+/g, ' ').trim().slice(0, 120),
      };
    }
  }

  const hashtagCounts: Record<string, number> = {};
  for (const t of tweets)
    for (const h of t.entities?.hashtags || [])
      hashtagCounts[h.tag] = (hashtagCounts[h.tag] || 0) + 1;
  const topHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  const hourCounts: Record<number, number> = {};
  const dayCounts: Record<string, number> = {};
  const times: number[] = [];
  for (const t of tweets) {
    const d = new Date(t.created_at);
    if (!t.created_at || isNaN(d.getTime())) continue;
    times.push(d.getTime());
    hourCounts[d.getUTCHours()] = (hourCounts[d.getUTCHours()] || 0) + 1;
    dayCounts[DAYS[d.getUTCDay()]] = (dayCounts[DAYS[d.getUTCDay()]] || 0) + 1;
  }
  const mostActiveHour = Number(
    Object.entries(hourCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 0
  );
  const mostActiveDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

  // Frequency from the real span of the sample (order-independent: a pinned or
  // out-of-order post can't make the span negative any more)
  let postingFrequency = 'Unknown';
  let postsPerDay = 0;
  let sampleDays = 0;
  if (times.length >= 2) {
    sampleDays = (Math.max(...times) - Math.min(...times)) / DAY_MS;
    // n posts span n-1 gaps; floor the span at a day so a burst isn't "40/day"
    postsPerDay = (times.length - 1) / Math.max(sampleDays, 1);
    postingFrequency = frequencyLabel(postsPerDay);
  }

  return {
    tweets,
    stats: {
      totalTweets: n,
      avgEngagementRate,
      engagementRateKnown,
      pooledEngagementRate,
      medianViews,
      outlier,
      avgLikes,
      avgRetweets,
      avgReplies,
      topHashtags,
      postingFrequency,
      postsPerDay,
      sampleDays,
      mostActiveHour,
      mostActiveDay,
    },
    contentPatterns: {
      avgTweetLength: sum((t) => t.text.length) / n,
      emojiUsage: (tweets.filter((t) => EMOJI.test(t.text)).length / n) * 100,
      questionTweets: tweets.filter((t) => t.text.includes('?')).length,
      threadStarters: tweets.filter(
        (t) => t.text.includes('🧵') || t.text.toLowerCase().includes('thread')
      ).length,
      articles: tweets.filter((t) => isArticlePost(t.text, t.entities?.urls)).length,
      mediaUsage: tweets.filter(hasMedia).length,
    },
  };
}
