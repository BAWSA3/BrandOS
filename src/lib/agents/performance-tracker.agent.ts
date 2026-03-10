// ===== PERFORMANCE TRACKER AGENT =====
// Syncs tweets and computes performance snapshots for 3/7/30-day windows

import prisma from '@/lib/db';

interface TweetMetrics {
  likes: number;
  retweets: number;
  replies: number;
  impressions: number;
  quotes?: number;
}

/**
 * Sync latest tweets for a brand from X API
 * Reuses the same pattern as /api/x-sync
 */
async function syncTweets(brandId: string, xUserId: string): Promise<number> {
  const token = process.env.X_BEARER_TOKEN;
  if (!token) return 0;

  try {
    const tweetFields = 'id,text,created_at,public_metrics,entities';
    const url = `https://api.x.com/2/users/${xUserId}/tweets?max_results=20&exclude=replies,retweets&tweet.fields=${tweetFields}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      console.error(`[performance-tracker] X API error: ${response.status}`);
      return 0;
    }

    const data = await response.json();
    const tweets = data.data || [];
    const syncedAt = new Date();
    let synced = 0;

    for (const tweet of tweets) {
      const metrics = tweet.public_metrics || {
        like_count: 0, retweet_count: 0, reply_count: 0, impression_count: 0, quote_count: 0,
      };

      const likes = metrics.like_count || 0;
      const retweets = metrics.retweet_count || 0;
      const replies = metrics.reply_count || 0;
      const impressions = metrics.impression_count || 1;
      const engagementRate = ((likes + retweets + replies) / impressions) * 100;

      const metricsJson = JSON.stringify({
        likes, retweets, replies,
        impressions: metrics.impression_count || 0,
        quotes: metrics.quote_count || 0,
      });

      const entitiesJson = tweet.entities
        ? JSON.stringify({
            hashtags: tweet.entities.hashtags?.map((h: { tag: string }) => h.tag) || [],
            mentions: tweet.entities.mentions?.map((m: { username: string }) => m.username) || [],
            urls: tweet.entities.urls?.map((u: { expanded_url: string }) => u.expanded_url) || [],
          })
        : null;

      await prisma.brandTweet.upsert({
        where: { tweetId: tweet.id },
        update: { metrics: metricsJson, entities: entitiesJson, engagementRate, syncedAt },
        create: {
          tweetId: tweet.id,
          text: tweet.text,
          postedAt: new Date(tweet.created_at),
          metrics: metricsJson,
          entities: entitiesJson,
          engagementRate,
          brandId,
          syncedAt,
        },
      });
      synced++;
    }

    return synced;
  } catch (error) {
    console.error('[performance-tracker] Sync error:', error);
    return 0;
  }
}

/**
 * Compute a performance snapshot for a given time window
 */
async function computeSnapshot(brandId: string, windowDays: number): Promise<void> {
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() - windowDays);

  const tweets = await prisma.brandTweet.findMany({
    where: {
      brandId,
      postedAt: { gte: windowStart },
    },
    orderBy: { postedAt: 'desc' },
  });

  if (tweets.length === 0) {
    // Still create a snapshot with zeros so UI can show "no data"
    await prisma.performanceSnapshot.create({
      data: {
        brandId,
        windowDays,
        totalPosts: 0,
        totalImpressions: 0,
        totalLikes: 0,
        totalRetweets: 0,
        totalReplies: 0,
        avgEngagementRate: 0,
        avgImpressions: 0,
      },
    });
    return;
  }

  // Parse metrics from each tweet
  const parsed = tweets.map(t => {
    const m: TweetMetrics = JSON.parse(t.metrics);
    return {
      id: t.tweetId,
      postedAt: t.postedAt,
      text: t.text,
      likes: m.likes || 0,
      retweets: m.retweets || 0,
      replies: m.replies || 0,
      impressions: m.impressions || 0,
      engagementRate: t.engagementRate || 0,
      length: t.text.length,
    };
  });

  const totalImpressions = parsed.reduce((s, t) => s + t.impressions, 0);
  const totalLikes = parsed.reduce((s, t) => s + t.likes, 0);
  const totalRetweets = parsed.reduce((s, t) => s + t.retweets, 0);
  const totalReplies = parsed.reduce((s, t) => s + t.replies, 0);
  const avgEngagement = parsed.reduce((s, t) => s + t.engagementRate, 0) / parsed.length;
  const avgImpressions = totalImpressions / parsed.length;
  const avgLength = Math.round(parsed.reduce((s, t) => s + t.length, 0) / parsed.length);

  // Find best/worst by engagement
  const sorted = [...parsed].sort((a, b) => b.engagementRate - a.engagementRate);
  const topTweetId = sorted[0]?.id || null;
  const bottomTweetId = sorted[sorted.length - 1]?.id || null;

  // Best posting hour
  const hourCounts: Record<number, number[]> = {};
  for (const t of parsed) {
    const hour = t.postedAt.getUTCHours();
    if (!hourCounts[hour]) hourCounts[hour] = [];
    hourCounts[hour].push(t.engagementRate);
  }
  const bestHour = Object.entries(hourCounts)
    .map(([h, rates]) => ({ hour: parseInt(h), avgRate: rates.reduce((s, r) => s + r, 0) / rates.length }))
    .sort((a, b) => b.avgRate - a.avgRate)[0]?.hour ?? null;

  // Best posting day
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayCounts: Record<string, number[]> = {};
  for (const t of parsed) {
    const day = dayNames[t.postedAt.getUTCDay()];
    if (!dayCounts[day]) dayCounts[day] = [];
    dayCounts[day].push(t.engagementRate);
  }
  const bestDay = Object.entries(dayCounts)
    .map(([d, rates]) => ({ day: d, avgRate: rates.reduce((s, r) => s + r, 0) / rates.length }))
    .sort((a, b) => b.avgRate - a.avgRate)[0]?.day ?? null;

  // Posting pattern
  const postingPattern = JSON.stringify({
    postsPerDay: (parsed.length / windowDays).toFixed(1),
    hourDistribution: Object.fromEntries(
      Object.entries(hourCounts).map(([h, rates]) => [h, rates.length])
    ),
    dayDistribution: Object.fromEntries(
      Object.entries(dayCounts).map(([d, rates]) => [d, rates.length])
    ),
  });

  await prisma.performanceSnapshot.create({
    data: {
      brandId,
      windowDays,
      totalPosts: parsed.length,
      totalImpressions,
      totalLikes,
      totalRetweets,
      totalReplies,
      avgEngagementRate: Math.round(avgEngagement * 100) / 100,
      avgImpressions: Math.round(avgImpressions),
      bestPostingHour: bestHour,
      bestPostingDay: bestDay,
      avgPostLength: avgLength,
      topTweetId,
      bottomTweetId,
      postingPattern,
    },
  });
}

/**
 * Run the performance tracker for a specific brand
 */
export async function runPerformanceTracker(brandId: string): Promise<{
  tweetsSynced: number;
  snapshotsCreated: number;
}> {
  // Get the brand's user to find xId
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    include: { user: { select: { xId: true } } },
  });

  if (!brand?.user?.xId) {
    console.log('[performance-tracker] No xId for brand', brandId);
    return { tweetsSynced: 0, snapshotsCreated: 0 };
  }

  // Step 1: Sync latest tweets
  const tweetsSynced = await syncTweets(brandId, brand.user.xId);

  // Step 2: Compute snapshots for all 3 windows
  for (const windowDays of [3, 7, 30]) {
    await computeSnapshot(brandId, windowDays);
  }

  return { tweetsSynced, snapshotsCreated: 3 };
}
