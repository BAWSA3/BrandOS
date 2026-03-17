import { NextRequest, NextResponse } from 'next/server';
import { geminiFlash, xBrandScorePrompt, XProfileData } from '@/lib/gemini';
import { resolveArchetype } from '@/lib/archetype-engine';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { recordScan } from '@/lib/scan-tracking';
import { brandScoreCache } from '@/lib/cache';

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

/** Validate API key from x-api-key header */
function validateApiKey(request: NextRequest): { valid: boolean; keyId?: string } {
  const apiKey = request.headers.get('x-api-key');

  if (!apiKey) {
    return { valid: false };
  }

  // Check against primary API key
  const primaryKey = process.env.BRANDOS_API_KEY;
  if (primaryKey && apiKey === primaryKey) {
    return { valid: true, keyId: 'primary' };
  }

  // Check against additional partner keys (comma-separated in env)
  const partnerKeys = process.env.BRANDOS_PARTNER_API_KEYS?.split(',').map((k) => k.trim()) || [];
  const partnerIndex = partnerKeys.indexOf(apiKey);
  if (partnerIndex !== -1) {
    return { valid: true, keyId: `partner-${partnerIndex}` };
  }

  return { valid: false };
}

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

export async function POST(request: NextRequest) {
  // CORS headers for API consumers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
    'Content-Type': 'application/json',
  };

  // Auth
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        message: 'Missing or invalid API key. Pass your key via the x-api-key header.',
        docs: 'https://mybrandos.app/api-docs',
      },
      { status: 401, headers }
    );
  }

  // Rate limit: 60 req/min per API key
  const { limited, remaining, resetIn } = checkRateLimit(`v1:${auth.keyId}`, {
    interval: 60_000,
    maxRequests: 60,
  });
  if (limited) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: Math.ceil(resetIn / 1000) },
      {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': Math.ceil(resetIn / 1000).toString(),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // Parse body
  let username: string;
  try {
    const body = await request.json();
    username = body.username;
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body', message: 'Expected JSON with { "username": "handle" }' },
      { status: 400, headers }
    );
  }

  if (!username || typeof username !== 'string') {
    return NextResponse.json(
      { error: 'Missing required field: username' },
      { status: 400, headers }
    );
  }

  const cleanUsername = username.replace(/^@/, '').trim();
  const origin = request.nextUrl.origin;

  // Fetch profile
  const profile = await fetchProfile(cleanUsername, origin);
  if (!profile) {
    return NextResponse.json(
      { error: 'Profile not found', message: `Could not find X profile for @${cleanUsername}` },
      { status: 404, headers }
    );
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
        return NextResponse.json(
          { error: 'Service temporarily unavailable', message: 'AI quota exceeded. Try again in a few minutes.' },
          { status: 503, headers }
        );
      }
      return NextResponse.json(
        { error: 'Analysis failed', message: 'Could not analyze profile. Try again.' },
        { status: 500, headers }
      );
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

    // Record scan (non-blocking)
    recordScan({
      username: profile.username,
      score: (brandScore.overallScore as number) || 0,
      archetype: (brandScore.archetype as { primary?: string })?.primary || '',
      enhanced: false,
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

  return NextResponse.json(
    {
      success: true,
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
      },
      meta: {
        analyzedAt,
        cached: fromCache,
        apiVersion: 'v1',
      },
    },
    {
      headers: {
        ...headers,
        'X-RateLimit-Remaining': remaining.toString(),
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      'Access-Control-Max-Age': '86400',
    },
  });
}
