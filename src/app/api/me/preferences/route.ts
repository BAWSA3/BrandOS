import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { isColorway } from '@/lib/colorways';
import { setColorway } from '@/lib/user-preferences';

/**
 * PATCH /api/me/preferences — save the signed-in user's display settings.
 * Body: { dashboardColorway: 'bone' | 'night' | 'klein' | 'paper' }. Own account only.
 */
async function handlePatch(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const colorway = body?.dashboardColorway;
  if (!isColorway(colorway)) {
    return NextResponse.json({ error: 'Unknown colorway' }, { status: 400 });
  }
  try {
    await setColorway(user.id, colorway);
  } catch {
    return NextResponse.json({ error: 'Could not save right now' }, { status: 503 });
  }
  return NextResponse.json({ dashboardColorway: colorway });
}

export const PATCH = withRateLimit(handlePatch, rateLimiters.standard);
