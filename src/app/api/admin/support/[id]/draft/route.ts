import { NextRequest, NextResponse } from 'next/server';
import { isAdminRequest } from '@/lib/admin-auth';
import { triageAndDraft } from '@/lib/support-inbox';

export const maxDuration = 60;

// POST /api/admin/support/:id/draft — re-run the agent: fresh triage + draft.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminRequest(request)))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const ok = await triageAndDraft(id).catch((e) => {
    console.error('[Admin/Support] draft error:', e);
    return false;
  });
  if (!ok)
    return NextResponse.json(
      { error: 'The agent could not draft this one. Try again in a minute.' },
      { status: 503 }
    );
  return NextResponse.json({ success: true });
}
