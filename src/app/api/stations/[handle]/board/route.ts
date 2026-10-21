import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { checkRateLimit, getClientIdentifier, rateLimiters } from '@/lib/rate-limit';
import { deleteOwnNote, getBoard, upsertNote } from '@/lib/station-board';

/**
 * /api/stations/[handle]/board: the station's polaroid wall.
 *   GET    public; visible notes (owner also sees hidden ones) + viewer state
 *   PUT    signed in with X; pin or edit your one note  { body, sticker }
 *   DELETE signed in; remove your note
 * Writes: 10/hour per user. See src/lib/station-board.ts for the rules.
 */
type Ctx = { params: Promise<{ handle: string }> };

const WRITE_LIMIT = { interval: 60 * 60 * 1000, maxRequests: 10 };

function limited(key: string, config = WRITE_LIMIT) {
  return checkRateLimit(key, config).limited
    ? NextResponse.json({ error: 'Too many changes. Try again later.' }, { status: 429 })
    : null;
}

export async function GET(request: NextRequest, { params }: Ctx) {
  const tooMany = limited(`board-read:${getClientIdentifier(request)}`, rateLimiters.relaxed);
  if (tooMany) return tooMany;
  const { handle } = await params;
  const all = request.nextUrl.searchParams.get('all') === '1';
  try {
    const board = await getBoard(handle, await getCurrentUser(), all);
    if (!board) return NextResponse.json({ error: 'Invalid station' }, { status: 400 });
    return NextResponse.json(board, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('[board] GET failed:', error);
    return NextResponse.json({ error: 'Could not load the board' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in with X to pin a note.' }, { status: 401 });
  const tooMany = limited(`board-write:${user.id}`);
  if (tooMany) return tooMany;
  let body: { body?: unknown; sticker?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { handle } = await params;
  try {
    const result = await upsertNote(handle, user, { body: body.body, sticker: body.sticker });
    return result.ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: result.error }, { status: result.status });
  } catch (error) {
    console.error('[board] PUT failed:', error);
    return NextResponse.json({ error: 'Could not pin your note' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Ctx) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  const tooMany = limited(`board-write:${user.id}`);
  if (tooMany) return tooMany;
  const { handle } = await params;
  try {
    const result = await deleteOwnNote(handle, user);
    return result.ok
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ error: result.error }, { status: result.status });
  } catch (error) {
    console.error('[board] DELETE failed:', error);
    return NextResponse.json({ error: 'Could not remove your note' }, { status: 500 });
  }
}
