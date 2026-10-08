import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { checkRateLimit, rateLimiters } from '@/lib/rate-limit';
import { noteAction } from '@/lib/station-board';

/**
 * POST /api/stations/[handle]/board/[noteId] { action: 'hide' | 'unhide' | 'report' }
 * hide/unhide: station owner only. report: any signed-in user, once per note;
 * 3 reports auto-hide the note until the owner unhides it.
 */
type Ctx = { params: Promise<{ handle: string; noteId: string }> };

export async function POST(request: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  if (checkRateLimit(`board-action:${user.id}`, rateLimiters.standard).limited) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  let body: { action?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { handle, noteId } = await params;
  try {
    const result = await noteAction(handle, noteId, user, body.action);
    return result.ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: result.error }, { status: result.status });
  } catch (error) {
    console.error('[board] action failed:', error);
    return NextResponse.json({ error: 'Could not update the note' }, { status: 500 });
  }
}
