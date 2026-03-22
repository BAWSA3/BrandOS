import { NextRequest } from 'next/server';
import {
  authenticateApiKey,
  checkApiKeyRateLimit,
  recordApiUsage,
  apiError,
  apiSuccess,
  apiOptionsHandler,
} from '@/lib/api-auth';
import { checkRateLimit } from '@/lib/rate-limit';

// =============================================================================
// GET /api/v1/profile/:username
// Returns X profile data WITHOUT running the AI scoring engine.
// Fast, cheap, no Gemini cost. Use this for profile lookups.
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const startTime = Date.now();
  const { username } = await params;

  // Auth
  const auth = await authenticateApiKey(request);
  if (!auth.authenticated) {
    return apiError(auth.error || 'Unauthorized', auth.statusCode || 401);
  }

  // Rate limit
  if (auth.apiKey) {
    const rateLimited = checkApiKeyRateLimit(auth.apiKey);
    if (rateLimited) return rateLimited;
  } else {
    const { limited } = checkRateLimit('v1:env-key', { interval: 60_000, maxRequests: 60 });
    if (limited) return apiError('Rate limit exceeded', 429);
  }

  const cleanUsername = username.replace(/^@/, '').trim();
  if (!cleanUsername) {
    return apiError('Missing username', 400);
  }

  const origin = request.nextUrl.origin;

  try {
    const response = await fetch(`${origin}/api/x-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: cleanUsername }),
    });

    if (!response.ok) {
      return apiError(`Could not find X profile for @${cleanUsername}`, 404);
    }

    const data = await response.json();
    if (!data.profile) {
      return apiError(`Could not find X profile for @${cleanUsername}`, 404);
    }

    const p = data.profile;

    const latencyMs = Date.now() - startTime;
    if (auth.apiKey) {
      recordApiUsage(auth.apiKey, '/v1/profile/:username', 'GET', 200, latencyMs, cleanUsername);
    }

    return apiSuccess({
      username: p.username,
      displayName: p.name,
      description: p.description,
      profileImageUrl: p.profile_image_url,
      verified: p.verified || false,
      location: p.location || null,
      url: p.url || null,
      createdAt: p.created_at || null,
      metrics: {
        followers: p.public_metrics?.followers_count || 0,
        following: p.public_metrics?.following_count || 0,
        tweets: p.public_metrics?.tweet_count || 0,
        listed: p.public_metrics?.listed_count || 0,
      },
      influenceTier:
        (p.public_metrics?.followers_count || 0) >= 2_000_000
          ? 'elite'
          : (p.public_metrics?.followers_count || 0) >= 100_000
            ? 'creator'
            : (p.public_metrics?.followers_count || 0) >= 10_000
              ? 'micro'
              : 'audience',
    });
  } catch {
    return apiError('Failed to fetch profile', 500);
  }
}

export async function OPTIONS() {
  return apiOptionsHandler();
}
