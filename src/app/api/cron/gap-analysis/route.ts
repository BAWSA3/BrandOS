import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { runGapAnalysis } from '@/lib/agents/gap-analysis.agent';

export const maxDuration = 300;

export async function GET(request: NextRequest) {
  // Verify cron secret — REQUIRED
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get brands that have both performance snapshots and viral benchmarks
    const brands = await prisma.brand.findMany({
      where: {
        AND: [
          { performanceSnapshots: { some: {} } },
          { viralBenchmarks: { some: {} } },
        ],
      },
      select: { id: true, name: true },
    });

    const results = [];
    for (const brand of brands) {
      const result = await runGapAnalysis(brand.id);
      results.push({
        brandId: brand.id,
        brandName: brand.name,
        overallGapScore: result?.overallGapScore ?? null,
        success: !!result,
      });
    }

    return NextResponse.json({
      success: true,
      brandsProcessed: brands.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[cron/gap-analysis] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
