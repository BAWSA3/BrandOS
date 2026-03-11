import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { runPerformanceTracker } from '@/lib/agents/performance-tracker.agent';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Verify cron secret — REQUIRED
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all brands with synced tweets (active users)
    const brands = await prisma.brand.findMany({
      where: {
        tweets: { some: {} },
      },
      select: { id: true, name: true },
    });

    const results = [];
    for (const brand of brands) {
      const result = await runPerformanceTracker(brand.id);
      results.push({ brandId: brand.id, brandName: brand.name, ...result });
    }

    return NextResponse.json({
      success: true,
      brandsProcessed: brands.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[cron/performance-sync] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
