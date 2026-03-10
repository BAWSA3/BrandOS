import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateIntelligentContent } from '@/lib/agents/content-intelligence.agent';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get brands that have gap analyses (prerequisite for intelligent content)
    const brands = await prisma.brand.findMany({
      where: {
        gapAnalyses: { some: {} },
      },
      select: { id: true, name: true },
    });

    const results = [];
    for (const brand of brands) {
      const result = await generateIntelligentContent(brand.id);
      results.push({ brandId: brand.id, brandName: brand.name, ...result });
    }

    return NextResponse.json({
      success: true,
      brandsProcessed: brands.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[cron/content-intelligence] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
