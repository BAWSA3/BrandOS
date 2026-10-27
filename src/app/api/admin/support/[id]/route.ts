import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isAdminRequest } from '@/lib/admin-auth';
import { memberContext } from '@/lib/support-agent';

type Params = { params: Promise<{ id: string }> };

const STATUSES = ['open', 'replied', 'closed'];
const MAX_DRAFT_CHARS = 8_000;

// GET /api/admin/support/:id — one thread with its messages and the member's context.
export async function GET(request: NextRequest, { params }: Params) {
  if (!(await isAdminRequest(request)))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const thread = await prisma.supportThread.findUnique({
      where: { id },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!thread) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const member = await memberContext(thread.userId, thread.email).catch(() => null);
    return NextResponse.json({ thread, member });
  } catch (error) {
    console.error('[Admin/Support] GET thread error:', error);
    return NextResponse.json({ error: 'Failed to load the thread' }, { status: 500 });
  }
}

// PATCH /api/admin/support/:id { status?, draft? } — close/reopen, save the draft.
export async function PATCH(request: NextRequest, { params }: Params) {
  if (!(await isAdminRequest(request)))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const body = (await request.json()) as { status?: unknown; draft?: unknown };
    const data: { status?: string; draft?: string | null } = {};
    if (body.status !== undefined) {
      if (typeof body.status !== 'string' || !STATUSES.includes(body.status))
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      data.status = body.status;
    }
    if (body.draft !== undefined) {
      if (body.draft !== null && typeof body.draft !== 'string')
        return NextResponse.json({ error: 'Invalid draft' }, { status: 400 });
      data.draft = body.draft ? body.draft.slice(0, MAX_DRAFT_CHARS) : null;
    }
    if (!Object.keys(data).length)
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
    await prisma.supportThread.update({ where: { id }, data });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin/Support] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update the thread' }, { status: 500 });
  }
}
