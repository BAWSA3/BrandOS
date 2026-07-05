import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { markBriefCompleted } from '@/lib/daily-brief';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body: { briefId?: unknown };
  try {
    body = (await request.json()) as { briefId?: unknown };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const briefId = typeof body.briefId === 'string' ? body.briefId : null;
  if (!briefId) {
    return NextResponse.json({ error: 'Missing briefId' }, { status: 400 });
  }

  const brief = await markBriefCompleted(briefId, user.id);
  if (!brief) {
    return NextResponse.json(
      { error: 'Brief not found or already completed' },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, completedAt: brief.completedAt });
}
