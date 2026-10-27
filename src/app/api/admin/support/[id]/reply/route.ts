import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { sendReply, SendError } from '@/lib/support-inbox';

const MAX_REPLY_CHARS = 8_000;

// POST /api/admin/support/:id/reply { body } — send the reply to the member.
// The only route in the inbox that sends email.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request)))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  try {
    const { body } = (await request.json()) as { body?: unknown };
    if (typeof body !== 'string' || body.length > MAX_REPLY_CHARS)
      return NextResponse.json({ error: 'Invalid reply' }, { status: 400 });
    await sendReply(id, body);
    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof SendError) return NextResponse.json({ error: e.message }, { status: 400 });
    console.error('[Admin/Support] reply error:', e);
    return NextResponse.json({ error: 'Failed to send the reply' }, { status: 500 });
  }
}
