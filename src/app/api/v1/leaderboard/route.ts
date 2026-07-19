import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
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
// GET /api/v1/leaderboard
// Returns top scored creators. Supports ?range=week|month|all&limit=25
// Backed by user_profiles (Prisma) — previously read a dead file-based store
// that was always empty on Vercel's read-only filesystem.
// =============================================================================

function rangeCutoff(range: string): Date | null {
  const now = Date.now();
  if (range === 'week') return new Date(now - 7 * 24 * 60 * 60 * 1000);
  if (range === 'month') return new Date(now - 30 * 24 * 60 * 60 * 1000);
  return null;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

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

  const { searchParams } = new URL(request.url);
  const range = searchParams.get('range') || 'week';
  const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10) || 25, 100);

  const cutoff = rangeCutoff(range);
  const where = cutoff ? { lastScannedAt: { gte: cutoff } } : {};

  // Degrade to an empty board on DB errors (e.g. migration 016 not yet
  // applied) rather than 500ing a documented public endpoint.
  let total = 0;
  let profiles: { username: string; displayName: string; currentScore: number }[] = [];
  const images = new Map<string, string>();
  try {
    [total, profiles] = await Promise.all([
      prisma.userProfile.count({ where }),
      prisma.userProfile.findMany({
        where,
        orderBy: [{ currentScore: 'desc' }, { lastScannedAt: 'desc' }],
        take: limit,
        select: {
          username: true,
          displayName: true,
          currentScore: true,
        },
      }),
    ]);

    // Enrich with profile images from the X profile cache (best-effort)
    if (profiles.length > 0) {
      const cached = await prisma.xProfileCache.findMany({
        where: { username: { in: profiles.map((p) => p.username) } },
        select: { username: true, profileData: true },
      });
      for (const c of cached) {
        try {
          const parsed = JSON.parse(c.profileData);
          if (typeof parsed?.profile_image_url === 'string') {
            images.set(c.username, parsed.profile_image_url);
          }
        } catch {
          // ignore malformed cache rows
        }
      }
    }
  } catch (err) {
    console.error('[v1/leaderboard] DB error, returning empty board:', err);
  }

  const latencyMs = Date.now() - startTime;
  if (auth.apiKey) {
    recordApiUsage(auth.apiKey, '/v1/leaderboard', 'GET', 200, latencyMs);
  }

  return apiSuccess(
    {
      entries: profiles.map((p, i) => ({
        rank: i + 1,
        username: p.username,
        displayName: p.displayName,
        score: p.currentScore,
        profileImageUrl: images.get(p.username) || '',
      })),
    },
    { range, total, returned: profiles.length }
  );
}

export async function OPTIONS() {
  return apiOptionsHandler();
}
