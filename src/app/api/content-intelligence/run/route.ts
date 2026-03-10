import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/db';
import { runMarketScanner } from '@/lib/agents/market-scanner.agent';
import { runPerformanceTracker } from '@/lib/agents/performance-tracker.agent';
import { runGapAnalysis } from '@/lib/agents/gap-analysis.agent';
import { generateIntelligentContent } from '@/lib/agents/content-intelligence.agent';

// POST /api/content-intelligence/run — runs the full pipeline on-demand
export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    if (!accessToken) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: user.id } });
    if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { brandId } = await request.json();
    if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 });

    const brand = await prisma.brand.findFirst({ where: { id: brandId, userId: dbUser.id } });
    if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

    const pipeline = {
      marketScan: { status: 'pending' as string, result: null as unknown },
      performanceSync: { status: 'pending' as string, result: null as unknown },
      gapAnalysis: { status: 'pending' as string, result: null as unknown },
      contentGeneration: { status: 'pending' as string, result: null as unknown },
    };

    // Stage 1: Market Scanner
    try {
      pipeline.marketScan.result = await runMarketScanner(brandId);
      pipeline.marketScan.status = 'completed';
    } catch (error) {
      pipeline.marketScan.status = 'failed';
      pipeline.marketScan.result = error instanceof Error ? error.message : 'Unknown error';
    }

    // Stage 2: Performance Tracker
    try {
      pipeline.performanceSync.result = await runPerformanceTracker(brandId);
      pipeline.performanceSync.status = 'completed';
    } catch (error) {
      pipeline.performanceSync.status = 'failed';
      pipeline.performanceSync.result = error instanceof Error ? error.message : 'Unknown error';
    }

    // Stage 3: Gap Analysis (depends on stages 1 & 2)
    try {
      pipeline.gapAnalysis.result = await runGapAnalysis(brandId);
      pipeline.gapAnalysis.status = pipeline.gapAnalysis.result ? 'completed' : 'skipped';
    } catch (error) {
      pipeline.gapAnalysis.status = 'failed';
      pipeline.gapAnalysis.result = error instanceof Error ? error.message : 'Unknown error';
    }

    // Stage 4: Content Generation (depends on stage 3)
    try {
      pipeline.contentGeneration.result = await generateIntelligentContent(brandId);
      pipeline.contentGeneration.status = 'completed';
    } catch (error) {
      pipeline.contentGeneration.status = 'failed';
      pipeline.contentGeneration.result = error instanceof Error ? error.message : 'Unknown error';
    }

    return NextResponse.json({
      success: true,
      pipeline,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[content-intelligence/run] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
