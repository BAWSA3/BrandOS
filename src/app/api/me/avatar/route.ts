import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { refreshAvatar } from '@/lib/avatar-refresh';

/**
 * POST /api/me/avatar — the signed-in user's stored X photo failed to load
 * (it was changed on X): look the profile up now and return the current photo.
 * Own account only; throttled to one lookup per 10 minutes per user plus the
 * per-IP strict limit.
 */
async function handlePost() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  const avatar = await refreshAvatar(user.id, 10 * 60 * 1000);
  return NextResponse.json({ avatar });
}

export const POST = withRateLimit(handlePost, rateLimiters.strict);
