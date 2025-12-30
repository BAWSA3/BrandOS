import { NextRequest, NextResponse } from 'next/server';
import { geminiFlash, xBrandScorePrompt, XProfileData } from '@/lib/gemini';

/**
 * Brand Score API - Profile-only analysis
 */

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

    // Fetch profile
    const profile = await fetchProfile(cleanUsername, origin);
    if (!profile) {
      return NextResponse.json(
        { error: 'Could not fetch profile' },
        { status: 404 }
      );
    }

    console.log('=== BRAND SCORE ANALYSIS ===');
    console.log(`Username: @${cleanUsername}`);
    console.log('============================');

    // Generate prompt and call Gemini
    const prompt = xBrandScorePrompt(profile);
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
          enhanced: false,
        }),
      });
    } catch (leaderboardError) {
      console.error('Leaderboard save error:', leaderboardError);
    }

    return NextResponse.json({
      profile,
      brandScore,
      meta: {
        enhanced: false,
        analyzedAt: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Brand Score API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
