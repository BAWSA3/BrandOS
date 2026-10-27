import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { isAdminRequest } from '@/lib/admin-auth';

const STATUSES = ['open', 'replied', 'closed'];

// GET /api/admin/support?status=open — the support inbox: threads, newest first.
export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request)))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const status = new URL(request.url).searchParams.get('status') ?? 'open';
    const where = STATUSES.includes(status) ? { status } : {};
    const [threads, counts] = await Promise.all([
      prisma.supportThread.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        take: 100,
        select: {
          id: true,
          source: true,
          email: true,
          name: true,
          subject: true,
          status: true,
          category: true,
          priority: true,
          summary: true,
          draft: true,
          lastMessageAt: true,
          _count: { select: { messages: true } },
        },
      }),
      prisma.supportThread.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);
    return NextResponse.json({
      threads: threads.map(({ _count, draft, ...t }) => ({
        ...t,
        hasDraft: !!draft,
        messageCount: _count.messages,
      })),
      counts: Object.fromEntries(counts.map((c) => [c.status, c._count._all])),
    });
  } catch (error) {
    console.error('[Admin/Support] GET error:', error);
    return NextResponse.json({ error: 'Failed to load the inbox' }, { status: 500 });
  }
}
