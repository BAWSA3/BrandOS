import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { xBrandScorePrompt, XProfileData } from '@/lib/gemini';
import { resolveArchetype, getEvolutionInfo } from '@/lib/archetype-engine';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { recordScan } from '@/lib/scan-tracking';
import { brandScoreCache } from '@/lib/cache';
import { getUserProfile } from '@/lib/user-profiles';
import { parseBrandScore, heuristicBrandScore } from '@/lib/score-schemas';

/** How long a cached score stays valid (6 hours in ms) */
const SCORE_CACHE_TTL_MINUTES = 360;

/**
 * Brand Score API - Profile-only analysis
 */

/** Score profiles via Claude Haiku (fast, cheap, reliable) */
async function scoreWithClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const anthropic = new Anthropic({ apiKey });
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '';

  if (message.stop_reason === 'max_tokens') {
    console.warn('[BrandScore] Response truncated — may fail to parse');
  }

  return text;
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

async function handlePost(request: NextRequest) {
  try {
    const { username, forceReevaluate = false } = (await request.json()) as {
      username: string;
      forceReevaluate?: boolean;
    };

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const cleanUsername = username.replace(/^@/, '').trim();
    const origin = request.nextUrl.origin;

    // Fetch profile
    const profile = await fetchProfile(cleanUsername, origin);
    if (!profile) {
      return NextResponse.json({ error: 'Could not fetch profile' }, { status: 404 });
    }

    console.log('=== BRAND SCORE ANALYSIS ===');
    console.log(`Username: @${cleanUsername}`);
    console.log('============================');

    // === SCORE CACHING: return consistent score within 6h window ===
    const cacheKey = `score:${cleanUsername}`;
    const cachedResult = brandScoreCache.get<{
      brandScore: Record<string, unknown>;
      archetypeDecision: {
        reason: string;
        evolved: boolean;
        previousArchetype?: string;
        archetype: Record<string, unknown>;
      } | null;
      cachedAt: string;
    }>(cacheKey);

    // Build score context from user history
    const userProfile = getUserProfile(cleanUsername);
    const scoreHistory = userProfile?.scores || [];
    const scoreValues = scoreHistory.map((s) => s.value);
    const scoreRange =
      scoreValues.length >= 2
        ? {
            low: Math.min(...scoreValues),
            high: Math.max(...scoreValues),
            samples: scoreValues.length,
          }
        : null;

    if (cachedResult && !forceReevaluate) {
      console.log(`[BrandScore] Returning cached score for @${cleanUsername}`);

      const evolutionInfo = getEvolutionInfo(cleanUsername);

      return NextResponse.json({
        profile,
        brandScore: cachedResult.brandScore,
        meta: {
          enhanced: false,
          analyzedAt: cachedResult.cachedAt,
          archetypeSource: cachedResult.archetypeDecision?.reason || 'cached',
          evolved: cachedResult.archetypeDecision?.evolved || false,
          previousArchetype: cachedResult.archetypeDecision?.previousArchetype,
          evolutionInfo: evolutionInfo || undefined,
          cached: true,
          scoreContext: scoreRange
            ? {
                range: scoreRange,
                note: `Based on ${scoreRange.samples} scans, your score typically falls between ${scoreRange.low}–${scoreRange.high}.`,
              }
            : undefined,
        },
      });
    }

    // Generate prompt and call Claude. Model output is validated + clamped by
    // parseBrandScore (no untyped JSON.parse); on malformed/unusable output we
    // fall back to the deterministic heuristic so the funnel never hard-fails.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- rich, varied model object consumed dynamically downstream
    let brandScore: any;
    try {
      const prompt = xBrandScorePrompt(profile);
      const responseText = await scoreWithClaude(prompt);
      const parsed = parseBrandScore(responseText);
      if (parsed) {
        brandScore = parsed;
      } else {
        console.warn(
          `[BrandScore] Output failed validation for @${cleanUsername} — heuristic fallback`
        );
        brandScore = heuristicBrandScore(profile);
      }
    } catch (scoreError) {
      console.error(`[BrandScore] Failed to score @${cleanUsername}:`, scoreError);
      brandScore = heuristicBrandScore(profile);
    }

    // === SCORE SMOOTHING: prevent jarring score swings for returning users ===
    // LLMs are non-deterministic — same profile can produce ±10 point variance.
    // For returning users, clamp the new score within ±5 of their stored score
    // so the number feels stable while still allowing real growth/decline over time.
    const MAX_SCORE_DRIFT = 5;
    if (userProfile && !forceReevaluate) {
      const storedScore = userProfile.currentScore;
      const rawScore = brandScore.overallScore;
      if (Math.abs(rawScore - storedScore) > MAX_SCORE_DRIFT) {
        brandScore.overallScore =
          rawScore > storedScore ? storedScore + MAX_SCORE_DRIFT : storedScore - MAX_SCORE_DRIFT;
        console.log(
          `[BrandScore] Smoothed score for @${cleanUsername}: ${rawScore} → ${brandScore.overallScore} (stored: ${storedScore})`
        );
      }
    }

    // === ARCHETYPE CONSISTENCY ENGINE ===
    // Resolve archetype: new users get Gemini result, returning users get cached
    let archetypeDecision;
    try {
      archetypeDecision = await resolveArchetype(
        cleanUsername,
        profile.name || profile.username,
        brandScore.archetype,
        brandScore.overallScore,
        forceReevaluate
      );

      // Replace Gemini's archetype with the resolved (consistent) one
      brandScore.archetype = archetypeDecision.archetype;

      console.log(
        `[BrandScore] Archetype for @${cleanUsername}: ${archetypeDecision.archetype.primary} (${archetypeDecision.reason})`
      );
    } catch (archetypeError) {
      console.error('Archetype resolution error:', archetypeError);
      // Continue with Gemini's result if archetype engine fails
    }

    // Cache the computed score + archetype for consistency
    const analyzedAt = new Date().toISOString();
    brandScoreCache.set(
      cacheKey,
      {
        brandScore,
        archetypeDecision: archetypeDecision
          ? {
              reason: archetypeDecision.reason,
              evolved: archetypeDecision.evolved,
              previousArchetype: archetypeDecision.previousArchetype,
              archetype: archetypeDecision.archetype,
            }
          : null,
        cachedAt: analyzedAt,
      },
      SCORE_CACHE_TTL_MINUTES
    );

    // Get evolution info for UI
    const evolutionInfo = getEvolutionInfo(cleanUsername);

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

    // Record scan to Supabase (non-blocking)
    recordScan({
      username: profile.username,
      score: brandScore.overallScore,
      archetype: brandScore.archetype?.primary || '',
      enhanced: false,
    }).catch((err) => console.error('Scan tracking error:', err));

    return NextResponse.json({
      profile,
      brandScore,
      meta: {
        enhanced: false,
        analyzedAt,
        archetypeSource: archetypeDecision?.reason || 'gemini',
        evolved: archetypeDecision?.evolved || false,
        previousArchetype: archetypeDecision?.previousArchetype,
        evolutionInfo: evolutionInfo || undefined,
        cached: false,
        scoreContext: scoreRange
          ? {
              range: scoreRange,
              note: `Based on ${scoreRange.samples} scans, your score typically falls between ${scoreRange.low}–${scoreRange.high}.`,
            }
          : undefined,
      },
    });
  } catch (error) {
    console.error('Brand Score API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePost, rateLimiters.ai);
