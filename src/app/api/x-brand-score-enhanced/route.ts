import { NextRequest, NextResponse } from 'next/server';
import { geminiFlash, xBrandScorePrompt, enhancedBrandScorePrompt, XProfileData } from '@/lib/gemini';
import { features, getTierInfo } from '@/lib/features';

/**
 * Enhanced Brand Score API
 * 
 * Automatically uses tweet analysis if X API Basic tier is available.
 * Falls back to profile-only analysis on Free tier.
 */

interface TweetData {
  text: string;
  created_at: string;
  likes: number;
  retweets: number;
  replies: number;
  impressions?: number;
}

async function fetchProfile(username: string, origin: string): Promise<XProfileData | null> {
  try {
    const response = await fetch(`${origin}/api/x-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) return null;
    
    const data = await response.json();
    if (!data.profile) return null;

    return {
      name: data.profile.name,
      username: data.profile.username,
      description: data.profile.description,
      profile_image_url: data.profile.profile_image_url,
      public_metrics: data.profile.public_metrics || {
        followers_count: 0,
        following_count: 0,
        tweet_count: 0,
        listed_count: 0,
      },
      created_at: data.profile.created_at,
      verified: data.profile.verified,
      location: data.profile.location,
      url: data.profile.url,
    };
  } catch (error) {
    console.error('Profile fetch error:', error);
    return null;
  }
}

async function fetchTweets(username: string, origin: string) {
  if (!features.tweetAnalysis) {
    return null;
  }

  try {
    const response = await fetch(`${origin}/api/x-tweets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, maxResults: 100 }),
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.upgradeRequired) {
        console.log('Tweet analysis requires X API Basic tier');
      }
      return null;
    }

    const data = await response.json();
    return {
      tweets: data.tweets.map((t: { text: string; created_at: string; public_metrics: { like_count: number; retweet_count: number; reply_count: number; impression_count?: number } }) => ({
        text: t.text,
        created_at: t.created_at,
        likes: t.public_metrics?.like_count || 0,
        retweets: t.public_metrics?.retweet_count || 0,
        replies: t.public_metrics?.reply_count || 0,
        impressions: t.public_metrics?.impression_count,
      })) as TweetData[],
      stats: data.analysis.stats,
      contentPatterns: data.analysis.contentPatterns,
    };
  } catch (error) {
    console.error('Tweets fetch error:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json() as { username: string };

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const cleanUsername = username.replace(/^@/, '').trim();
    const origin = request.nextUrl.origin;

    // Fetch profile (always required)
    const profile = await fetchProfile(cleanUsername, origin);
    if (!profile) {
      return NextResponse.json(
        { error: 'Could not fetch profile' },
        { status: 404 }
      );
    }

    // Try to fetch tweets if Basic tier is available
    const tweetData = await fetchTweets(cleanUsername, origin);
    const isEnhanced = tweetData !== null;

    console.log('=== BRAND SCORE ANALYSIS ===');
    console.log(`Username: @${cleanUsername}`);
    console.log(`Mode: ${isEnhanced ? 'ENHANCED (with tweets)' : 'BASIC (profile only)'}`);
    console.log(`API Tier: ${features.xApiTier}`);
    console.log('============================');

    // Generate appropriate prompt
    let prompt: string;
    if (isEnhanced && tweetData) {
      prompt = enhancedBrandScorePrompt({
        profile,
        tweets: tweetData.tweets,
        stats: tweetData.stats,
        contentPatterns: tweetData.contentPatterns,
      });
    } else {
      prompt = xBrandScorePrompt(profile);
    }

    // Call Gemini
    const result = await geminiFlash.generateContent(prompt);
    const responseText = result.response.text();

    // Parse JSON response
    let brandScore;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      brandScore = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', parseError);
      console.error('Raw response:', responseText);
      return NextResponse.json(
        { error: 'Failed to analyze profile' },
        { status: 500 }
      );
    }

    // Save to leaderboard
    try {
      await fetch(`${origin}/api/leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: profile.username,
          name: profile.name,
          profile_image_url: profile.profile_image_url,
          score: brandScore.overallScore,
          enhanced: isEnhanced,
        }),
      });
    } catch (leaderboardError) {
      console.error('Leaderboard save error:', leaderboardError);
    }

    return NextResponse.json({
      profile,
      brandScore,
      meta: {
        enhanced: isEnhanced,
        tier: features.xApiTier,
        tierInfo: getTierInfo(),
        analyzedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Enhanced Brand Score API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check feature availability
 */
export async function GET() {
  return NextResponse.json(getTierInfo());
}






