import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, rateLimiters } from '@/lib/rate-limit';
import Anthropic from '@anthropic-ai/sdk';
import { buildOppRoastPrompt, OppRoastResult } from '@/prompts/opp-roast';
import supabase from '@/lib/supabase';
import type { MutualInteractionResult } from '@/lib/interaction-scanner';

interface ProfileData {
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
}

interface BrandScoreData {
  overallScore: number;
  phases: {
    define: { score: number };
    check: { score: number };
    generate: { score: number };
    scale: { score: number };
  };
  archetype: {
    primary: string;
    emoji: string;
    tagline: string;
    description: string;
  };
}

async function fetchBrandScore(
  username: string,
  origin: string
): Promise<{ profile: ProfileData; brandScore: BrandScoreData } | null> {
  try {
    const response = await fetch(`${origin}/api/x-brand-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username }),
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

async function generateRoast(
  user1Profile: ProfileData,
  user1Score: BrandScoreData,
  user2Profile: ProfileData,
  user2Score: BrandScoreData,
  interactionData?: MutualInteractionResult | null
): Promise<OppRoastResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const anthropic = new Anthropic({ apiKey });

  const prompt = buildOppRoastPrompt(
    {
      username: user1Profile.username,
      displayName: user1Profile.name,
      archetype: user1Score.archetype.primary,
      score: user1Score.overallScore,
      phases: {
        define: user1Score.phases.define.score,
        check: user1Score.phases.check.score,
        generate: user1Score.phases.generate.score,
        scale: user1Score.phases.scale.score,
      },
      description: user1Profile.description,
      followers: user1Profile.public_metrics.followers_count,
      tweetCount: user1Profile.public_metrics.tweet_count,
    },
    {
      username: user2Profile.username,
      displayName: user2Profile.name,
      archetype: user2Score.archetype.primary,
      score: user2Score.overallScore,
      phases: {
        define: user2Score.phases.define.score,
        check: user2Score.phases.check.score,
        generate: user2Score.phases.generate.score,
        scale: user2Score.phases.scale.score,
      },
      description: user2Profile.description,
      followers: user2Profile.public_metrics.followers_count,
      tweetCount: user2Profile.public_metrics.tweet_count,
    },
    interactionData
  );

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse roast response');

  const roast = JSON.parse(jsonMatch[0]) as OppRoastResult;

  // Server-side override: ensure verdict winner matches the actual higher score
  const correctWinner =
    user1Score.overallScore >= user2Score.overallScore
      ? `@${user1Profile.username}`
      : `@${user2Profile.username}`;

  if (roast.verdict.winner !== correctWinner) {
    console.warn(
      `[opp] Claude picked wrong winner "${roast.verdict.winner}", correcting to "${correctWinner}"`
    );
    roast.verdict.winner = correctWinner;
  }

  // Ensure insights exist (fallback if Claude omitted)
  if (!roast.insights) {
    roast.insights = {
      topicOverlap: `Both @${user1Profile.username} and @${user2Profile.username} operate in the creator space but with different approaches.`,
      strengthContrast: `The data shows a clear edge in brand fundamentals for the winner.`,
      weaknessExploit: `The gap isn't as wide as the score suggests — there's an opening.`,
    };
  }

  return roast;
}

export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const { limited, resetIn } = checkRateLimit(`opp:${clientId}`, rateLimiters.ai);

    if (limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(resetIn / 1000).toString() } }
      );
    }

    const { user1, user2, interactionData } = (await request.json()) as {
      user1: string;
      user2: string;
      interactionData?: MutualInteractionResult | null;
    };

    if (!user1 || !user2) {
      return NextResponse.json({ error: 'Both usernames are required' }, { status: 400 });
    }

    const clean1 = user1.replace(/^@/, '').trim().toLowerCase();
    const clean2 = user2.replace(/^@/, '').trim().toLowerCase();

    if (!clean1 || !clean2) {
      return NextResponse.json({ error: 'Invalid username format' }, { status: 400 });
    }

    if (clean1 === clean2) {
      return NextResponse.json({ error: "You can't be your own opp" }, { status: 400 });
    }

    const origin = request.nextUrl.origin;

    // Fetch both brand scores in parallel
    const [result1, result2] = await Promise.all([
      fetchBrandScore(clean1, origin),
      fetchBrandScore(clean2, origin),
    ]);

    if (!result1) {
      return NextResponse.json(
        { error: `Could not find or score @${clean1}` },
        { status: 404 }
      );
    }

    if (!result2) {
      return NextResponse.json(
        { error: `Could not find or score @${clean2}` },
        { status: 404 }
      );
    }

    // Generate roast + insights via Claude
    const roast = await generateRoast(
      result1.profile,
      result1.brandScore,
      result2.profile,
      result2.brandScore,
      interactionData
    );

    const winnerUsername = result1.brandScore.overallScore >= result2.brandScore.overallScore
      ? result1.profile.username
      : result2.profile.username;

    // Record matchup for leaderboard (fire and forget)
    Promise.resolve(
      supabase.from('OppMatchups').insert({
        user1_username: result1.profile.username.toLowerCase(),
        user2_username: result2.profile.username.toLowerCase(),
        user1_score: result1.brandScore.overallScore,
        user2_score: result2.brandScore.overallScore,
        winner_username: winnerUsername.toLowerCase(),
        interaction_score: interactionData?.mutualScore || 0,
      })
    ).catch((err: unknown) => {
      console.error('[opp] matchup record error:', err);
    });

    return NextResponse.json({
      user1: {
        profile: result1.profile,
        score: result1.brandScore.overallScore,
        archetype: result1.brandScore.archetype.primary,
        phases: {
          define: result1.brandScore.phases.define.score,
          check: result1.brandScore.phases.check.score,
          generate: result1.brandScore.phases.generate.score,
          scale: result1.brandScore.phases.scale.score,
        },
      },
      user2: {
        profile: result2.profile,
        score: result2.brandScore.overallScore,
        archetype: result2.brandScore.archetype.primary,
        phases: {
          define: result2.brandScore.phases.define.score,
          check: result2.brandScore.phases.check.score,
          generate: result2.brandScore.phases.generate.score,
          scale: result2.brandScore.phases.scale.score,
        },
      },
      roast,
      interactionData: interactionData || null,
    });
  } catch (error) {
    console.error('[opp] error:', error);
    return NextResponse.json({ error: 'Failed to generate matchup' }, { status: 500 });
  }
}
