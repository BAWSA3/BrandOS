import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const result = await prisma.user.updateMany({
      where: {
        usageResetDate: { lte: oneMonthAgo },
      },
      data: {
        checksUsedThisMonth: 0,
        generationsUsedThisMonth: 0,
        usageResetDate: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      usersReset: result.count,
    });
  } catch (error) {
    console.error('[Cron Reset Usage] Error:', error);
    return NextResponse.json({ error: 'Failed to reset usage' }, { status: 500 });
  }
}
