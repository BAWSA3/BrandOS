import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import {
  authenticateApiKey,
  apiError,
  apiSuccess,
  apiOptionsHandler,
} from '@/lib/api-auth';

// =============================================================================
// GET /api/v1/usage
// Returns API usage stats for the authenticated key
// =============================================================================

const TIER_LIMITS: Record<string, { daily: number; perMinute: number }> = {
  FREE: { daily: 100, perMinute: 10 },
  STARTER: { daily: 1_000, perMinute: 30 },
  GROWTH: { daily: 10_000, perMinute: 60 },
  ENTERPRISE: { daily: 100_000, perMinute: 120 },
};

export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (!auth.authenticated) {
    return apiError(auth.error || 'Unauthorized', auth.statusCode || 401);
  }

  // Env-based keys don't have usage tracking
  if (!auth.apiKey) {
    return apiSuccess({
      tier: 'legacy',
      message: 'Usage tracking is available for registered API keys. Contact team@mybrandos.app to upgrade.',
    });
  }

  const key = auth.apiKey;
  const limits = TIER_LIMITS[key.tier] || TIER_LIMITS.FREE;
  const dailyLimit = key.dailyLimit ?? limits.daily;
  const minuteLimit = key.minuteLimit ?? limits.perMinute;

  // Check if daily counter needs mental reset
  const now = new Date();
  const lastReset = new Date(key.lastResetAt);
  const isNewDay = now.toISOString().slice(0, 10) !== lastReset.toISOString().slice(0, 10);
  const todayUsage = isNewDay ? 0 : key.requestsToday;

  // Get last 7 days of usage
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let dailyBreakdown: { date: string; requests: number }[] = [];

  try {
    const logs = await prisma.apiUsageLog.findMany({
      where: {
        apiKeyId: key.id,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const byDate = new Map<string, number>();
    for (const log of logs) {
      const date = log.createdAt.toISOString().slice(0, 10);
      byDate.set(date, (byDate.get(date) || 0) + 1);
    }
    dailyBreakdown = Array.from(byDate.entries()).map(([date, requests]) => ({ date, requests }));
  } catch {
    // Non-critical — continue without breakdown
  }

  return apiSuccess({
    key: {
      name: key.name,
      prefix: key.prefix,
      tier: key.tier,
      createdAt: key.createdAt.toISOString(),
      expiresAt: key.expiresAt?.toISOString() || null,
    },
    limits: {
      daily: dailyLimit,
      perMinute: minuteLimit,
    },
    usage: {
      today: todayUsage,
      total: key.requestsTotal,
      remaining: dailyLimit - todayUsage,
      lastUsedAt: key.lastUsedAt?.toISOString() || null,
    },
    last7Days: dailyBreakdown,
  });
}

export async function OPTIONS() {
  return apiOptionsHandler();
}
