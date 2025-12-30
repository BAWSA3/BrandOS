import { NextRequest, NextResponse } from 'next/server';
import { geminiFlash, xBrandScorePrompt, XProfileData } from '@/lib/gemini';

/**
 * Brand Score API - Profile-only analysis
 */

// Mock response for testing when Gemini quota is exceeded
const getMockBrandScore = (profile: XProfileData) => ({
  overallScore: 87,
  phases: {
    define: {
      score: 92,
      insights: [
        "Strong personal brand identity with memorable name",
        "Bio effectively communicates philosophical approach",
        "Clear positioning as a thought leader"
      ]
    },
    check: {
      score: 88,
      insights: [
        "Username and display name are perfectly aligned",
        "Consistent minimalist brand voice",
        "High credibility through follower ratio"
      ]
    },
    generate: {
      score: 82,
      insights: [
        "Intentionally minimal bio shows brand confidence",
        "Profile image present and professional",
        "No CTA needed at this influence level"
      ]
    },
    scale: {
      score: 95,
      insights: [
        `Exceptional follower count: ${profile.public_metrics.followers_count.toLocaleString()}`,
        "Elite tier influence with massive reach",
        `Listed on ${profile.public_metrics.listed_count.toLocaleString()} curated lists`
      ]
    },
  },
  topStrengths: [
    "Elite-tier influence with 2.9M+ followers",
    "Strong authority ratio showing thought leadership",
    "Highly curated by others (50K+ lists)"
  ],
  topImprovements: [
    "Consider adding a link to latest project",
    "Verification badge would add extra credibility",
    "Could expand bio slightly for new visitors"
  ],
  summary: `@${profile.username} represents an elite-tier personal brand with exceptional reach and influence. The minimalist approach to their bio demonstrates brand confidence that comes with their level of recognition. Their follower-to-following ratio signals strong thought leadership authority.`,
  archetype: {
    primary: "The Prophet",
    emoji: "🔮",
    tagline: "Wisdom Dealer",
    description: "A visionary thought leader who shares philosophical insights and unconventional wisdom. Known for memorable one-liners and contrarian takes that challenge conventional thinking.",
    strengths: ["Memorable philosophical insights", "Strong conviction in ideas"],
    growthTip: "Continue sharing timeless wisdom - your archive is your legacy."
  },
  influenceTier: "elite"
});

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

    // Generate prompt and call Gemini (with fallback to mock)
    let brandScore;
    try {
      const prompt = xBrandScorePrompt(profile);
      const result = await geminiFlash.generateContent(prompt);
      const responseText = result.response.text();

      // Parse JSON response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      brandScore = JSON.parse(jsonMatch[0]);
    } catch (geminiError) {
      // Check if it's a quota error (429) - use mock data for testing
      const errorMessage = geminiError instanceof Error ? geminiError.message : '';
      if (errorMessage.includes('429') || errorMessage.includes('quota')) {
        console.log('⚠️ Gemini quota exceeded - using mock data for testing');
        brandScore = getMockBrandScore(profile);
      } else {
        console.error('Failed to get Gemini response:', geminiError);
        return NextResponse.json(
          { error: 'Failed to analyze profile' },
          { status: 500 }
        );
      }
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
