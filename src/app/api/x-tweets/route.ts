import { NextRequest, NextResponse } from 'next/server';

// Tweet fields we want to fetch (requires Basic tier)
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
  };
  entities?: {
    hashtags?: { tag: string }[];
    mentions?: { username: string }[];
    urls?: { expanded_url: string }[];
  };
}

export interface TweetAnalysis {
  tweets: Tweet[];
  stats: {
    totalTweets: number;
    avgEngagementRate: number;
    avgLikes: number;
    avgRetweets: number;
    avgReplies: number;
    topHashtags: string[];
    postingFrequency: string;
    mostActiveHour: number;
    mostActiveDay: string;
  };
  contentPatterns: {
    avgTweetLength: number;
    emojiUsage: number;
    questionTweets: number;
    threadStarters: number;
    mediaUsage: number;
  };
}

/**
 * Fetch recent tweets for a user
 * REQUIRES: X API Basic tier ($100/month)
 * 
 * This endpoint will return 403 on Free tier
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, username, maxResults = 100 } = await request.json() as { 
      userId?: string;
      username?: string;
      maxResults?: number;
    };

    if (!userId && !username) {
      return NextResponse.json(
        { error: 'Either userId or username is required' },
        { status: 400 }
      );
    }

    const bearerToken = process.env.X_BEARER_TOKEN;

    if (!bearerToken) {
      return NextResponse.json(
        { error: 'X API not configured' },
        { status: 500 }
      );
    }

    // If username provided, first get user ID
    let targetUserId = userId;
    if (!targetUserId && username) {
      const userResponse = await fetch(
        `https://api.twitter.com/2/users/by/username/${username}`,
        {
          headers: {
            'Authorization': `Bearer ${bearerToken}`,
          },
        }
      );

      if (!userResponse.ok) {
        const error = await userResponse.json();
        console.error('User lookup error:', error);
        return NextResponse.json(
          { error: 'Failed to find user' },
          { status: userResponse.status }
        );
      }

      const userData = await userResponse.json();
      targetUserId = userData.data?.id;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Could not resolve user ID' },
        { status: 400 }
      );
    }

    // Fetch user's tweets (requires Basic tier)
    // exclude=replies,retweets to get only original posts for better content pillar analysis
    const tweetsUrl = `https://api.twitter.com/2/users/${targetUserId}/tweets?max_results=${Math.min(maxResults, 100)}&tweet.fields=${TWEET_FIELDS}&exclude=replies,retweets`;

    const tweetsResponse = await fetch(tweetsUrl, {
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
      },
    });

    if (!tweetsResponse.ok) {
      const error = await tweetsResponse.json();
      console.error('Tweets fetch error:', tweetsResponse.status, error);
      
      // Check for tier-specific errors
      if (tweetsResponse.status === 403) {
        return NextResponse.json(
          { 
            error: 'Tweet access requires X API Basic tier ($100/month)',
            upgradeRequired: true,
            upgradeUrl: 'https://developer.twitter.com/en/portal/products'
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
    const tweets: Tweet[] = tweetsData.data || [];

    // Analyze tweets
    const analysis = analyzeTweets(tweets);

    console.log('=== TWEETS FETCHED ===');
    console.log(`User ID: ${targetUserId}`);
    console.log(`Tweets retrieved: ${tweets.length}`);
    console.log(`Avg engagement: ${analysis.stats.avgEngagementRate.toFixed(2)}%`);
    console.log('======================');

    return NextResponse.json({
      tweets,
      analysis,
      meta: tweetsData.meta,
    });

  } catch (error) {
    console.error('X Tweets API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Analyze tweets for patterns and metrics
 */
function analyzeTweets(tweets: Tweet[]): TweetAnalysis {
  if (tweets.length === 0) {
    return {
      tweets: [],
      stats: {
        totalTweets: 0,
        avgEngagementRate: 0,
        avgLikes: 0,
        avgRetweets: 0,
        avgReplies: 0,
        topHashtags: [],
        postingFrequency: 'Unknown',
        mostActiveHour: 0,
        mostActiveDay: 'Unknown',
      },
      contentPatterns: {
        avgTweetLength: 0,
        emojiUsage: 0,
        questionTweets: 0,
        threadStarters: 0,
        mediaUsage: 0,
      },
    };
  }

  // Calculate engagement metrics
  const totalLikes = tweets.reduce((sum, t) => sum + (t.public_metrics?.like_count || 0), 0);
  const totalRetweets = tweets.reduce((sum, t) => sum + (t.public_metrics?.retweet_count || 0), 0);
  const totalReplies = tweets.reduce((sum, t) => sum + (t.public_metrics?.reply_count || 0), 0);
  const totalImpressions = tweets.reduce((sum, t) => sum + (t.public_metrics?.impression_count || 0), 0);

  const avgLikes = totalLikes / tweets.length;
  const avgRetweets = totalRetweets / tweets.length;
  const avgReplies = totalReplies / tweets.length;
  const avgEngagementRate = totalImpressions > 0 
    ? ((totalLikes + totalRetweets + totalReplies) / totalImpressions) * 100 
    : 0;

  // Hashtag analysis
  const hashtagCounts: Record<string, number> = {};
  tweets.forEach(t => {
    t.entities?.hashtags?.forEach(h => {
      hashtagCounts[h.tag] = (hashtagCounts[h.tag] || 0) + 1;
    });
  });
  const topHashtags = Object.entries(hashtagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tag]) => tag);

  // Posting time analysis
  const hourCounts: Record<number, number> = {};
  const dayCounts: Record<string, number> = {};
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  tweets.forEach(t => {
    if (t.created_at) {
      const date = new Date(t.created_at);
      const hour = date.getUTCHours();
      const day = days[date.getUTCDay()];
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    }
  });

  const mostActiveHour = Object.entries(hourCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || '0';
  const mostActiveDay = Object.entries(dayCounts)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown';

  // Content pattern analysis
  const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  
  const avgTweetLength = tweets.reduce((sum, t) => sum + t.text.length, 0) / tweets.length;
  const tweetsWithEmojis = tweets.filter(t => emojiRegex.test(t.text)).length;
  const emojiUsage = (tweetsWithEmojis / tweets.length) * 100;
  const questionTweets = tweets.filter(t => t.text.includes('?')).length;
  const threadStarters = tweets.filter(t => t.text.includes('🧵') || t.text.toLowerCase().includes('thread')).length;
  const mediaUsage = tweets.filter(t => t.entities?.urls?.some(u => 
    u.expanded_url.includes('pic.twitter') || 
    u.expanded_url.includes('video.twimg')
  )).length;

  // Calculate posting frequency
  let postingFrequency = 'Unknown';
  if (tweets.length >= 2) {
    const firstDate = new Date(tweets[tweets.length - 1].created_at);
    const lastDate = new Date(tweets[0].created_at);
    const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
    const tweetsPerDay = tweets.length / Math.max(daysDiff, 1);
    
    if (tweetsPerDay >= 5) postingFrequency = 'Very Active (5+ per day)';
    else if (tweetsPerDay >= 2) postingFrequency = 'Active (2-5 per day)';
    else if (tweetsPerDay >= 1) postingFrequency = 'Regular (1-2 per day)';
    else if (tweetsPerDay >= 0.3) postingFrequency = 'Moderate (few per week)';
    else postingFrequency = 'Occasional (weekly or less)';
  }

  return {
    tweets,
    stats: {
      totalTweets: tweets.length,
      avgEngagementRate,
      avgLikes,
      avgRetweets,
      avgReplies,
      topHashtags,
      postingFrequency,
      mostActiveHour: parseInt(mostActiveHour),
      mostActiveDay,
    },
    contentPatterns: {
      avgTweetLength,
      emojiUsage,
      questionTweets,
      threadStarters,
      mediaUsage,
    },
  };
}






