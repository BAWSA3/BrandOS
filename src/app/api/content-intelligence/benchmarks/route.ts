import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/db';

// GET /api/content-intelligence/benchmarks?brandId=xxx&niche=xxx&limit=20
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

    const niche = request.nextUrl.searchParams.get('niche');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');

    const benchmarks = await prisma.viralBenchmark.findMany({
      where: {
        brandId,
        ...(niche ? { niche } : {}),
      },
      orderBy: { viralScore: 'desc' },
      take: Math.min(limit, 50),
    });

    // Parse JSON fields for response
    const parsed = benchmarks.map(b => ({
      ...b,
      metrics: JSON.parse(b.metrics),
      patterns: JSON.parse(b.patterns),
    }));

    return NextResponse.json({ benchmarks: parsed });
  } catch (error) {
    console.error('[benchmarks] GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
