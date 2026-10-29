import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { isColorway } from '@/lib/colorways';
import { isPersona, setColorway, setWalkthrough } from '@/lib/user-preferences';

/**
 * PATCH /api/me/preferences — save the signed-in user's display settings.
 * Body (any of): { dashboardColorway: 'bone' | 'night' | 'klein' | 'paper' }
 *   { walkthroughDone: true } (first-run walkthrough finished or skipped, migration 052)
 *   { persona: 'creator' | 'founder' | 'builder' | null }
 * Own account only.
 */
async function handlePatch(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Nothing to save' }, { status: 400 });
  }
  const colorway = body.dashboardColorway;
  const done = body.walkthroughDone;
  const persona = body.persona;
  if (colorway !== undefined && !isColorway(colorway)) {
    return NextResponse.json({ error: 'Unknown colorway' }, { status: 400 });
  }
  if (done !== undefined && done !== true) {
    return NextResponse.json({ error: 'walkthroughDone can only be true' }, { status: 400 });
  }
  if (persona !== undefined && persona !== null && !isPersona(persona)) {
    return NextResponse.json({ error: 'Unknown persona' }, { status: 400 });
  }
  if (colorway === undefined && done === undefined && persona === undefined) {
    return NextResponse.json({ error: 'Nothing to save' }, { status: 400 });
  }
  try {
    if (colorway !== undefined) await setColorway(user.id, colorway);
    if (done !== undefined || persona !== undefined) {
      await setWalkthrough(user.id, { done, persona });
    }
  } catch {
    return NextResponse.json({ error: 'Could not save right now' }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}

export const PATCH = withRateLimit(handlePatch, rateLimiters.standard);
