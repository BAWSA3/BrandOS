import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { hasPro } from '@/lib/billing';
import { dashboardV2For } from '@/lib/dashboard-v2';
import { checkRateLimit } from '@/lib/rate-limit';
import { peopleToKnow, setMessaged } from '@/lib/people-to-know';

/**
 * People to know (dashboard v2 Playbook + Today; migration 053).
 * GET   → this week's list for the signed-in member (generated on the first
 *         visit of the week: X lookups + one model call, at most 3 tries/day)
 * PATCH { handle, messaged } → tick or untick "I messaged them"
 * Own data only: everything is keyed by the session's user, never the body.
 */
export const maxDuration = 60;

async function member() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (!hasPro(user) || !(await dashboardV2For(user))) return null;
  return user;
}

export async function GET() {
  const user = await member();
  if (!user) return NextResponse.json({ error: 'Not available' }, { status: 403 });
  // Generation costs X lookups + a model call: a few tries a day per member
  const generate = !checkRateLimit(`people-gen:${user.id}`, {
    interval: 24 * 60 * 60 * 1000,
    maxRequests: 3,
  }).limited;
  try {
    return NextResponse.json(await peopleToKnow(user, { generate }), {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (e) {
    console.error('[people-to-know] GET failed:', e);
    return NextResponse.json({ error: 'Could not load people to know' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await member();
  if (!user) return NextResponse.json({ error: 'Not available' }, { status: 403 });
  if (checkRateLimit(`people-tick:${user.id}`, { interval: 60 * 1000, maxRequests: 30 }).limited)
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  let body: { handle?: unknown; messaged?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const handle = typeof body.handle === 'string' ? body.handle.replace(/^@/, '') : '';
  if (!/^[A-Za-z0-9_]{1,15}$/.test(handle) || typeof body.messaged !== 'boolean')
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  try {
    const ok = await setMessaged(user.id, handle, body.messaged);
    return ok
      ? NextResponse.json({ success: true })
      : NextResponse.json({ error: "Not on this week's list" }, { status: 404 });
  } catch (e) {
    console.error('[people-to-know] PATCH failed:', e);
    return NextResponse.json({ error: 'Could not save' }, { status: 500 });
  }
}
