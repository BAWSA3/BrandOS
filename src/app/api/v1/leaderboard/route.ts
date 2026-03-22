import { NextRequest } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
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
// =============================================================================

interface LeaderboardEntry {
  username: string;
  displayName: string;
  score: number;
  profileImage: string;
  timestamp: number;
  isCrypto?: boolean;
}

const LEADERBOARD_FILE = path.join(process.cwd(), 'data', 'leaderboard.json');

async function readLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const data = await fs.readFile(LEADERBOARD_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
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
  const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100);

  let entries = await readLeaderboard();

  // Filter by time range
  const now = Date.now();
  if (range === 'week') {
    entries = entries.filter((e) => now - e.timestamp < 7 * 24 * 60 * 60 * 1000);
  } else if (range === 'month') {
    entries = entries.filter((e) => now - e.timestamp < 30 * 24 * 60 * 60 * 1000);
  }

  // Sort by score desc
  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.timestamp - a.timestamp;
  });

  const top = entries.slice(0, limit);

  const latencyMs = Date.now() - startTime;
  if (auth.apiKey) {
    recordApiUsage(auth.apiKey, '/v1/leaderboard', 'GET', 200, latencyMs);
  }

  return apiSuccess(
    {
      entries: top.map((e, i) => ({
        rank: i + 1,
        username: e.username,
        displayName: e.displayName,
        score: e.score,
        profileImageUrl: e.profileImage,
      })),
    },
    { range, total: entries.length, returned: top.length }
  );
}

export async function OPTIONS() {
  return apiOptionsHandler();
}
