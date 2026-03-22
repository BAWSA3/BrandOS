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
import { scoreUsername } from '../route';

// =============================================================================
// GET /api/v1/score/:username
// Convenience endpoint — same result as POST, friendlier for simple integrations
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
    return apiError(auth.error || 'Unauthorized', auth.statusCode || 401, {
      docs: 'https://mybrandos.app/docs',
    });
  }

  // Rate limit
  if (auth.apiKey) {
    const rateLimited = checkApiKeyRateLimit(auth.apiKey);
    if (rateLimited) return rateLimited;
  } else {
    const { limited } = checkRateLimit('v1:env-key', { interval: 60_000, maxRequests: 60 });
    if (limited) return apiError('Rate limit exceeded', 429);
  }

  if (!username) {
    return apiError('Missing username in URL path', 400);
  }

  const origin = request.nextUrl.origin;
  const result = await scoreUsername(username, origin);

  // Track usage
  const latencyMs = Date.now() - startTime;
  if (auth.apiKey) {
    recordApiUsage(auth.apiKey, '/v1/score/:username', 'GET', result.error ? (result.status || 500) : 200, latencyMs, username);
  }

  if (result.error) {
    return apiError(result.error, result.status || 500);
  }

  return apiSuccess(result.data);
}

export async function OPTIONS() {
  return apiOptionsHandler();
}
