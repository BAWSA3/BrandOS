import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';

/**
 * DELETE /api/accounts/[id] — stop tracking a brand (and its competitors) or a
 * competitor. Only accounts in the caller's own workspace.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  const workspace = await getCurrentWorkspace(user);
  if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 403 });

  const { id } = await params;
  const { count } = await prisma.trackedAccount.deleteMany({
    where: { id, workspaceId: workspace.id },
  });
  if (!count) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
