import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/db';

// GET /api/content-intelligence/performance?brandId=xxx&window=7
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

    const windowDays = parseInt(request.nextUrl.searchParams.get('window') || '7');

    // Get latest snapshot for the requested window
    const snapshot = await prisma.performanceSnapshot.findFirst({
      where: { brandId, windowDays },
      orderBy: { computedAt: 'desc' },
    });

    // Get all snapshots for trend chart (last 10 per window)
    const history = await prisma.performanceSnapshot.findMany({
      where: { brandId, windowDays },
      orderBy: { computedAt: 'desc' },
      take: 10,
    });

    // Parse posting pattern if exists
    const parsed = snapshot ? {
      ...snapshot,
      postingPattern: snapshot.postingPattern ? JSON.parse(snapshot.postingPattern) : null,
    } : null;

    return NextResponse.json({
      snapshot: parsed,
      history: history.map(h => ({
        ...h,
        postingPattern: h.postingPattern ? JSON.parse(h.postingPattern) : null,
      })),
    });
  } catch (error) {
    console.error('[performance] GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
