import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { runMarketScanner } from '@/lib/agents/market-scanner.agent';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all brands that have active content niches
    const brands = await prisma.brand.findMany({
      where: {
        contentNiches: { some: { isActive: true } },
      },
      select: { id: true, name: true },
    });

    const results = [];
    for (const brand of brands) {
      const result = await runMarketScanner(brand.id);
      results.push({ brandId: brand.id, brandName: brand.name, ...result });
    }

    return NextResponse.json({
      success: true,
      brandsProcessed: brands.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[cron/market-scan] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
