import { NextRequest, NextResponse } from 'next/server';
import { geminiFlash, xBrandScorePrompt, XProfileData } from '@/lib/gemini';
import { resolveArchetype } from '@/lib/archetype-engine';
import { recordScan, extractIntelligence } from '@/lib/scan-tracking';
import { brandScoreCache } from '@/lib/cache';
import {
  apiError,
  apiSuccess,
  apiOptionsHandler,
} from '@/lib/api-auth';
import { assertCanScan } from '@/lib/scan-guard';
import prisma from '@/lib/db';
import { logSecurityEvent, getClientIp } from '@/lib/audit-log';

// =============================================================================
// BrandOS Public API v1 — Brand Score
// =============================================================================
//
// POST /api/v1/score
// Headers: x-api-key: <your-api-key>
// Body: { "username": "handle" }
//
// Returns: brand score, archetype, phase scores, strengths, improvements
// =============================================================================

const SCORE_CACHE_TTL_MINUTES = 360;

/** Fetch X profile via internal API */
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
  } catch {
    return null;
  }
}

/** Score a single username — shared logic for POST and GET */
export async function scoreUsername(
  username: string,
  origin: string
): Promise<{ data?: Record<string, unknown>; error?: string; status?: number }> {
  const cleanUsername = username.replace(/^@/, '').trim();

  if (!cleanUsername) {
    return { error: 'Missing required field: username', status: 400 };
  }

  // Fetch profile
  const profile = await fetchProfile(cleanUsername, origin);
  if (!profile) {
    return { error: `Could not find X profile for @${cleanUsername}`, status: 404 };
  }

  // Check cache
  const cacheKey = `score:${cleanUsername}`;
  const cached = brandScoreCache.get<{
    brandScore: Record<string, unknown>;
    cachedAt: string;
  }>(cacheKey);

  let brandScore: Record<string, unknown>;
  let analyzedAt: string;
  let fromCache = false;

  if (cached) {
    brandScore = cached.brandScore;
    analyzedAt = cached.cachedAt;
    fromCache = true;
  } else {
    // Call Gemini
    try {
      const prompt = xBrandScorePrompt(profile);
      const result = await geminiFlash.generateContent(prompt);
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON in response');
      brandScore = JSON.parse(jsonMatch[0]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('429') || msg.includes('quota')) {
        return { error: 'AI quota exceeded. Try again in a few minutes.', status: 503 };
      }
      return { error: 'Could not analyze profile. Try again.', status: 500 };
    }

    // Resolve archetype consistency
    try {
      const decision = await resolveArchetype(
        cleanUsername,
        profile.name || profile.username,
        brandScore.archetype as { primary: string; emoji: string; tagline: string },
        brandScore.overallScore as number,
        false
      );
      brandScore.archetype = decision.archetype;
    } catch {
      // Continue with Gemini's archetype
    }

    analyzedAt = new Date().toISOString();

    // Cache it
    brandScoreCache.set(cacheKey, { brandScore, cachedAt: analyzedAt }, SCORE_CACHE_TTL_MINUTES);

    // Record scan (non-blocking) — persist full intelligence
    recordScan({
      username: profile.username,
      score: (brandScore.overallScore as number) || 0,
      archetype: (brandScore.archetype as { primary?: string })?.primary || '',
      enhanced: false,
      intelligence: extractIntelligence(brandScore),
    }).catch(() => {});
  }

  // Build clean response
  const archetype = brandScore.archetype as {
    primary?: string;
    emoji?: string;
    tagline?: string;
    description?: string;
  } | undefined;

  const phases = brandScore.phases as {
    define?: { score: number; insights: string[] };
    check?: { score: number; insights: string[] };
    generate?: { score: number; insights: string[] };
    scale?: { score: number; insights: string[] };
  } | undefined;

  return {
    data: {
      username: profile.username,
      displayName: profile.name,
      profileImageUrl: profile.profile_image_url,
      verified: profile.verified,
      followers: profile.public_metrics.followers_count,
      score: {
        overall: brandScore.overallScore,
        identity: phases?.define?.score || 0,
        consistency: phases?.check?.score || 0,
        content: phases?.generate?.score || 0,
        growth: phases?.scale?.score || 0,
      },
      archetype: {
        name: archetype?.primary || 'Unknown',
        emoji: archetype?.emoji || '',
        tagline: archetype?.tagline || '',
        description: archetype?.description || '',
      },
      insights: {
        identity: phases?.define?.insights || [],
        consistency: phases?.check?.insights || [],
        content: phases?.generate?.insights || [],
        growth: phases?.scale?.insights || [],
      },
      strengths: (brandScore.topStrengths as string[]) || [],
      improvements: (brandScore.topImprovements as string[]) || [],
      influenceTier: brandScore.influenceTier || 'emerging',
      summary: (brandScore.summary as string) || '',
      analyzedAt,
      cached: fromCache,
    },
  };
}

export async function POST(request: NextRequest) {
  // Parse body
  let username: string;
  let workspaceId: string | undefined;
  try {
    const body = await request.json();
    username = body.username;
    workspaceId = body.workspaceId;
  } catch {
    return apiError('Invalid request body. Expected JSON with { "username": "handle" }', 400);
  }

  if (!username || typeof username !== 'string') {
    return apiError('Missing required field: username', 400);
  }

  const cleanUsername = username.replace(/^@/, '').trim();

  // Phase 1: auth + plan guard (replaces API key auth)
  const guard = await assertCanScan(cleanUsername, workspaceId);
  if (!guard.allowed) {
    await logSecurityEvent({
      category: 'scan',
      eventType: 'scan_rejected',
      success: false,
      metadata: { error_code: guard.code, route: '/api/v1/score' },
      ip: getClientIp(request.headers),
      userAgent: request.headers.get('user-agent'),
    });
    return apiError(guard.error, guard.status);
  }

  // Return cached scan if available
  if (guard.cachedScan) {
    return apiSuccess({
      username: cleanUsername,
      score: { overall: guard.cachedScan.score },
      archetype: { name: guard.cachedScan.archetype },
      cached: true,
      scannedAt: guard.cachedScan.scannedAt,
    });
  }

  const origin = request.nextUrl.origin;
  const result = await scoreUsername(cleanUsername, origin);

  if (result.error) {
    return apiError(result.error, result.status || 500);
  }

  // Write to new BrandScan table
  const intelligence = result.data
    ? extractIntelligence(result.data as Record<string, unknown>)
    : null;

  if (intelligence) {
    prisma.brandScan.create({
      data: {
        userId: guard.user.id,
        workspaceId: guard.workspace.id,
        platformConnectionId: guard.platformConnection.id,
        xUsername: cleanUsername.toLowerCase(),
        score: ((result.data as Record<string, unknown>)?.score as { overall?: number })?.overall ?? 0,
        archetype: ((result.data as Record<string, unknown>)?.archetype as { name?: string })?.name ?? 'unknown',
        phaseScores: intelligence.phaseScores ?? {},
        strengths: intelligence.strengths ?? [],
        improvements: intelligence.improvements ?? [],
        insights: intelligence.insights ?? undefined,
        summary: intelligence.summary ?? undefined,
        influenceTier: intelligence.influenceTier ?? undefined,
        nextMoves: intelligence.nextMoves ?? undefined,
        contentPillars: intelligence.contentPillars ?? undefined,
      },
    }).catch((err) => console.error('[BrandScan] v1 write error:', err));
  }

  await logSecurityEvent({
    category: 'scan',
    eventType: 'scan_completed',
    userId: guard.user.id,
    workspaceId: guard.workspace.id,
    metadata: { route: '/api/v1/score' },
    ip: getClientIp(request.headers),
    userAgent: request.headers.get('user-agent'),
  });

  return apiSuccess(result.data, { analyzedAt: (result.data as Record<string, unknown>)?.analyzedAt });
}

export async function OPTIONS() {
  return apiOptionsHandler();
}
