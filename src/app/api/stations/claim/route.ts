import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth';
import { claimStation } from '@/lib/stations';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';

/**
 * POST /api/stations/claim { handle }: claim a reserved station by proving
 * ownership of the X account (see src/lib/stations.ts). Requires a signed-in
 * user; the proof is their verified X connection, not anything in the request.
 */
const HANDLE_RE = /^@?[A-Za-z0-9_]{1,30}$/;

const MESSAGES = {
  'no-reservation': 'No station is reserved for this handle yet.',
  'not-x-owner': 'Sign in with the X account that matches this station to claim it.',
  'claimed-by-other': 'This station has already been claimed.',
  'owns-other-station': 'Your account already owns a different station.',
} as const;

async function handlePost(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in to claim', code: 'auth' }, { status: 401 });

  let body: { handle?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const handle = typeof body.handle === 'string' && HANDLE_RE.test(body.handle) ? body.handle : '';
  if (!handle) return NextResponse.json({ error: 'Invalid handle' }, { status: 400 });

  try {
    const result = await claimStation(user, handle);
    if (!result.ok) {
      const status = result.reason === 'no-reservation' ? 404 : 403;
      return NextResponse.json({ error: MESSAGES[result.reason], code: result.reason }, { status });
    }
    revalidatePath(`/station/${result.handle}`);
    return NextResponse.json({ claimed: true, handle: result.handle });
  } catch (error) {
    console.error('[stations/claim] Failed:', error);
    return NextResponse.json({ error: 'Could not claim right now' }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePost, rateLimiters.strict);
