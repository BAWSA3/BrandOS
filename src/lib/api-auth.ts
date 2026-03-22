import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { prisma } from './db';
import type { ApiKey, ApiKeyTier } from '@prisma/client';

// =============================================================================
// BrandOS API Authentication & Usage Tracking
// =============================================================================

/** Tier-based rate limits */
const TIER_LIMITS: Record<ApiKeyTier, { daily: number; perMinute: number }> = {
  FREE: { daily: 100, perMinute: 10 },
  STARTER: { daily: 1_000, perMinute: 30 },
  GROWTH: { daily: 10_000, perMinute: 60 },
  ENTERPRISE: { daily: 100_000, perMinute: 120 },
};

/** In-memory per-minute tracker (resets naturally) */
const minuteTracker = new Map<string, { count: number; windowStart: number }>();

/** CORS headers for all API responses */
export const API_CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
  'Content-Type': 'application/json',
};

/** Hash a raw API key for storage/lookup */
export function hashApiKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

/** Generate a new API key: bos_<32 hex chars> */
export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  const raw = `bos_${hex}`;
  return {
    raw,
    hash: hashApiKey(raw),
    prefix: raw.slice(0, 12), // "bos_" + first 8 hex
  };
}

/** Result of authenticating an API request */
export interface ApiAuthResult {
  authenticated: boolean;
  apiKey?: ApiKey;
  error?: string;
  statusCode?: number;
}

/**
 * Authenticate a request via x-api-key header.
 * Falls back to env-based keys for backwards compat.
 */
export async function authenticateApiKey(request: NextRequest): Promise<ApiAuthResult> {
  const rawKey = request.headers.get('x-api-key');

  if (!rawKey) {
    return {
      authenticated: false,
      error: 'Missing API key. Pass your key via the x-api-key header.',
      statusCode: 401,
    };
  }

  // Check env-based keys first (backwards compat)
  const primaryKey = process.env.BRANDOS_API_KEY;
  if (primaryKey && rawKey === primaryKey) {
    return { authenticated: true };
  }
  const partnerKeys = process.env.BRANDOS_PARTNER_API_KEYS?.split(',').map((k) => k.trim()) || [];
  if (partnerKeys.includes(rawKey)) {
    return { authenticated: true };
  }

  // Check database
  const hash = hashApiKey(rawKey);
  try {
    const apiKey = await prisma.apiKey.findUnique({ where: { key: hash } });

    if (!apiKey) {
      return { authenticated: false, error: 'Invalid API key.', statusCode: 401 };
    }

    if (!apiKey.isActive) {
      return { authenticated: false, error: 'API key is deactivated.', statusCode: 403 };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { authenticated: false, error: 'API key has expired.', statusCode: 403 };
    }

    return { authenticated: true, apiKey };
  } catch (err) {
    console.error('[API Auth] DB lookup failed:', err);
    // If DB is down, allow env-based keys only
    return { authenticated: false, error: 'Authentication service unavailable.', statusCode: 503 };
  }
}

/**
 * Check rate limits for a DB-backed API key.
 * Returns null if OK, or a NextResponse if rate-limited.
 */
export function checkApiKeyRateLimit(apiKey: ApiKey): NextResponse | null {
  const limits = TIER_LIMITS[apiKey.tier];
  const dailyLimit = apiKey.dailyLimit ?? limits.daily;
  const minuteLimit = apiKey.minuteLimit ?? limits.perMinute;

  // Reset daily counter if it's a new day
  const now = new Date();
  const lastReset = new Date(apiKey.lastResetAt);
  const isNewDay = now.toISOString().slice(0, 10) !== lastReset.toISOString().slice(0, 10);
  const effectiveDailyUsage = isNewDay ? 0 : apiKey.requestsToday;

  // Check daily limit
  if (effectiveDailyUsage >= dailyLimit) {
    return NextResponse.json(
      {
        error: 'Daily request limit exceeded',
        limit: dailyLimit,
        tier: apiKey.tier,
        resetsAt: getNextMidnightUTC().toISOString(),
      },
      { status: 429, headers: API_CORS_HEADERS }
    );
  }

  // Check per-minute limit (in-memory)
  const minuteKey = `minute:${apiKey.id}`;
  const nowMs = Date.now();
  const tracker = minuteTracker.get(minuteKey);

  if (tracker && nowMs - tracker.windowStart < 60_000) {
    if (tracker.count >= minuteLimit) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          limit: `${minuteLimit} requests per minute`,
          retryAfter: Math.ceil((60_000 - (nowMs - tracker.windowStart)) / 1000),
        },
        {
          status: 429,
          headers: {
            ...API_CORS_HEADERS,
            'Retry-After': Math.ceil((60_000 - (nowMs - tracker.windowStart)) / 1000).toString(),
          },
        }
      );
    }
    tracker.count++;
  } else {
    minuteTracker.set(minuteKey, { count: 1, windowStart: nowMs });
  }

  return null; // No rate limit hit
}

/**
 * Record API usage (non-blocking).
 * Updates counters + writes log entry.
 */
export function recordApiUsage(
  apiKey: ApiKey,
  endpoint: string,
  method: string,
  statusCode: number,
  latencyMs: number,
  username?: string
): void {
  const now = new Date();
  const lastReset = new Date(apiKey.lastResetAt);
  const isNewDay = now.toISOString().slice(0, 10) !== lastReset.toISOString().slice(0, 10);

  // Update counters
  prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: {
        requestsToday: isNewDay ? 1 : { increment: 1 },
        requestsTotal: { increment: 1 },
        lastUsedAt: now,
        ...(isNewDay ? { lastResetAt: now } : {}),
      },
    })
    .catch((err) => console.error('[API Usage] Counter update failed:', err));

  // Write log entry
  prisma.apiUsageLog
    .create({
      data: {
        apiKeyId: apiKey.id,
        endpoint,
        method,
        statusCode,
        latencyMs,
        username,
      },
    })
    .catch((err) => console.error('[API Usage] Log write failed:', err));
}

/** Helper: next midnight UTC */
function getNextMidnightUTC(): Date {
  const tomorrow = new Date();
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  tomorrow.setUTCHours(0, 0, 0, 0);
  return tomorrow;
}

/**
 * Standard OPTIONS handler for CORS preflight
 */
export function apiOptionsHandler() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Build a standard API error response
 */
export function apiError(message: string, status: number, details?: Record<string, unknown>) {
  return NextResponse.json(
    { error: message, ...details },
    { status, headers: API_CORS_HEADERS }
  );
}

/**
 * Build a standard API success response
 */
export function apiSuccess(data: unknown, meta?: Record<string, unknown>) {
  return NextResponse.json(
    { success: true, data, meta: { apiVersion: 'v1', ...meta } },
    { headers: API_CORS_HEADERS }
  );
}
