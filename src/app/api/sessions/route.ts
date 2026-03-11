import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import prisma from '@/lib/db';

// POST — start a new session
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { feature } = (await request.json()) as { feature: string };

    if (!feature || typeof feature !== 'string') {
      return NextResponse.json({ error: 'feature is required' }, { status: 400 });
    }

    const session = await prisma.userSession.create({
      data: {
        userId: user.id,
        feature,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    console.error('Session start failed:', err);
    return NextResponse.json({ error: 'Failed to start session' }, { status: 500 });
  }
}

// PATCH — end a session
export async function PATCH(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { sessionId } = (await request.json()) as { sessionId: string };

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
    }

    // Find and verify ownership
    const session = await prisma.userSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== user.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.endedAt) {
      return NextResponse.json({ error: 'Session already ended' }, { status: 400 });
    }

    const endedAt = new Date();
    const durationMs = endedAt.getTime() - session.startedAt.getTime();

    await prisma.userSession.update({
      where: { id: sessionId },
      data: { endedAt, durationMs },
    });

    return NextResponse.json({ ok: true, durationMs });
  } catch (err) {
    console.error('Session end failed:', err);
    return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
  }
}
