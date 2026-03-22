import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
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
// GET /api/v1/history/:username
// Returns scan history for a username (up to 50 most recent)
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

  const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();

  if (!cleanUsername) {
    return apiError('Missing username', 400);
  }

  try {
    const scans = await prisma.brandScans.findMany({
      where: { username: cleanUsername },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        score: true,
        archetype: true,
        createdAt: true,
      },
    });

    if (scans.length === 0) {
      return apiError(`No scan history found for @${cleanUsername}`, 404);
    }

    const scores = scans.map((s) => s.score);
    const latencyMs = Date.now() - startTime;

    if (auth.apiKey) {
      recordApiUsage(auth.apiKey, '/v1/history/:username', 'GET', 200, latencyMs, cleanUsername);
    }

    return apiSuccess(
      {
        username: cleanUsername,
        scans: scans.map((s) => ({
          score: s.score,
          archetype: s.archetype,
          scannedAt: s.createdAt?.toISOString() || null,
        })),
        stats: {
          totalScans: scans.length,
          highScore: Math.max(...scores),
          lowScore: Math.min(...scores),
          currentScore: scores[0],
          averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
          firstScan: scans[scans.length - 1]?.createdAt?.toISOString() || null,
          lastScan: scans[0]?.createdAt?.toISOString() || null,
        },
      }
    );
  } catch (err) {
    console.error('[API v1/history] Error:', err);
    return apiError('Failed to fetch scan history', 500);
  }
}

export async function OPTIONS() {
  return apiOptionsHandler();
}
