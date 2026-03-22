import { NextRequest } from 'next/server';
import {
  authenticateApiKey,
  checkApiKeyRateLimit,
  recordApiUsage,
  apiError,
  apiSuccess,
  apiOptionsHandler,
} from '@/lib/api-auth';
import { scoreUsername } from '../score/route';

// =============================================================================
// POST /api/v1/batch
// Score multiple usernames in one request (max 10 per call)
// Requires STARTER tier or above
// =============================================================================

const MAX_BATCH_SIZE = 10;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Auth
  const auth = await authenticateApiKey(request);
  if (!auth.authenticated) {
    return apiError(auth.error || 'Unauthorized', auth.statusCode || 401, {
      docs: 'https://mybrandos.app/docs',
    });
  }

  // Batch requires DB-backed key (not env key) and at least STARTER tier
  if (!auth.apiKey) {
    return apiError('Batch scoring requires a registered API key (STARTER tier or above).', 403);
  }

  if (auth.apiKey.tier === 'FREE') {
    return apiError(
      'Batch scoring requires STARTER tier or above. Upgrade at https://mybrandos.app/docs#pricing',
      403,
      { currentTier: auth.apiKey.tier }
    );
  }

  // Rate limit
  const rateLimited = checkApiKeyRateLimit(auth.apiKey);
  if (rateLimited) return rateLimited;

  // Parse body
  let usernames: string[];
  try {
    const body = await request.json();
    usernames = body.usernames;
  } catch {
    return apiError('Invalid request body. Expected JSON with { "usernames": ["handle1", "handle2"] }', 400);
  }

  if (!Array.isArray(usernames) || usernames.length === 0) {
    return apiError('Missing required field: usernames (array of X handles)', 400);
  }

  if (usernames.length > MAX_BATCH_SIZE) {
    return apiError(`Maximum ${MAX_BATCH_SIZE} usernames per batch request`, 400, {
      maxBatchSize: MAX_BATCH_SIZE,
      received: usernames.length,
    });
  }

  const origin = request.nextUrl.origin;

  // Score all usernames concurrently
  const results = await Promise.allSettled(
    usernames.map(async (username) => {
      const clean = username.replace(/^@/, '').trim();
      const result = await scoreUsername(clean, origin);
      if (result.error) {
        return { username: clean, error: result.error, status: result.status };
      }
      return { username: clean, ...result.data };
    })
  );

  const scores = results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return { username: usernames[i], error: 'Internal error', status: 500 };
  });

  const succeeded = scores.filter((s) => !('error' in s && s.error)).length;
  const failed = scores.length - succeeded;

  // Track usage (count each username as a request)
  const latencyMs = Date.now() - startTime;
  recordApiUsage(auth.apiKey, '/v1/batch', 'POST', 200, latencyMs, `batch:${usernames.length}`);

  return apiSuccess(
    { results: scores },
    { total: usernames.length, succeeded, failed }
  );
}

export async function OPTIONS() {
  return apiOptionsHandler();
}
