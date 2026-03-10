import { NextRequest, NextResponse } from 'next/server';
import { VoiceConsistencyRequestSchema } from '@/lib/schemas/voice-consistency.schema';
import { analyzeVoiceConsistency } from '@/lib/voice-consistency';
import { features } from '@/lib/features';

interface FetchedTweet {
  id: string;
  text: string;
  created_at: string;
  public_metrics: {
    like_count: number;
    retweet_count: number;
    reply_count: number;
  };
}

async function fetchTweets(username: string, origin: string): Promise<FetchedTweet[] | null> {
  if (!features.tweetAnalysis) return null;

  try {
    const response = await fetch(`${origin}/api/x-tweets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, maxResults: 50 }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.tweets as FetchedTweet[];
  } catch {
    return null;
  }
}

async function fetchStoredFingerprint(username: string, origin: string) {
  try {
    const response = await fetch(`${origin}/api/x-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.profile?.created_at
      ? `Account created ${data.profile.created_at}.`
      : null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = VoiceConsistencyRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const cleanUsername = parsed.data.username.replace(/^@/, '').trim();
    const origin = request.nextUrl.origin;

    if (!features.tweetAnalysis) {
      return NextResponse.json(
        {
          error: 'Voice consistency analysis requires X API Basic tier for tweet access',
          upgradeRequired: true,
          upgradeUrl: 'https://developer.twitter.com/en/portal/products',
        },
        { status: 403 }
      );
    }

    const tweets = await fetchTweets(cleanUsername, origin);

    if (!tweets || tweets.length === 0) {
      return NextResponse.json(
        { error: 'Could not fetch tweets for this user' },
        { status: 404 }
      );
    }

    const fallbackDescription = await fetchStoredFingerprint(cleanUsername, origin);

    console.log('=== VOICE CONSISTENCY API ===');
    console.log(`Username: @${cleanUsername}`);
    console.log(`Tweets fetched: ${tweets.length}`);
    console.log('============================');

    const tweetInputs = tweets.map((t) => ({
      id: t.id,
      text: t.text,
      created_at: t.created_at,
    }));

    const report = await analyzeVoiceConsistency(tweetInputs, {
      fallbackDescription: fallbackDescription ?? undefined,
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Voice consistency analysis failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      report,
      meta: {
        username: cleanUsername,
        tweetsAnalyzed: tweets.length,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Voice consistency API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
