import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/db';

// GET /api/content-intelligence/gaps?brandId=xxx
export async function GET(request: NextRequest) {
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

    const brandId = request.nextUrl.searchParams.get('brandId');
    if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 });

    const brand = await prisma.brand.findFirst({ where: { id: brandId, userId: dbUser.id } });
    if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

    // Get latest gap analysis
    const latest = await prisma.gapAnalysis.findFirst({
      where: { brandId },
      orderBy: { computedAt: 'desc' },
    });

    // Get history for trend tracking
    const history = await prisma.gapAnalysis.findMany({
      where: { brandId },
      orderBy: { computedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        overallGapScore: true,
        hookStrength: true,
        formatMatch: true,
        toneAlignment: true,
        ctaEffectiveness: true,
        engagementVelocity: true,
        postingConsistency: true,
        computedAt: true,
      },
    });

    // Parse JSON fields
    const parsed = latest ? {
      ...latest,
      strengths: JSON.parse(latest.strengths),
      gaps: JSON.parse(latest.gaps),
      actionItems: JSON.parse(latest.actionItems),
    } : null;

    return NextResponse.json({ analysis: parsed, history });
  } catch (error) {
    console.error('[gaps] GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
