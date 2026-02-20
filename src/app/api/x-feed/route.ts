import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user: authUser }, error } = await supabase.auth.getUser(accessToken);
    if (error || !authUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({ where: { supabaseId: authUser.id } });
    if (!dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    // Verify ownership
    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: dbUser.id },
    });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Fetch tweets + aggregates in parallel
    const [tweets, aggregates, totalCount] = await Promise.all([
      prisma.brandTweet.findMany({
        where: { brandId },
        orderBy: { postedAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.brandTweet.aggregate({
        where: { brandId },
        _avg: {
          alignmentScore: true,
          engagementRate: true,
        },
        _max: {
          syncedAt: true,
        },
      }),
      prisma.brandTweet.count({ where: { brandId } }),
    ]);

    return NextResponse.json({
      tweets: tweets.map(t => ({
        id: t.id,
        tweetId: t.tweetId,
        text: t.text,
        postedAt: t.postedAt.toISOString(),
        metrics: JSON.parse(t.metrics),
        entities: t.entities ? JSON.parse(t.entities) : null,
        alignmentScore: t.alignmentScore,
        engagementRate: t.engagementRate,
        syncedAt: t.syncedAt.toISOString(),
      })),
      stats: {
        totalSynced: totalCount,
        avgAlignmentScore: aggregates._avg.alignmentScore
          ? Math.round(aggregates._avg.alignmentScore)
          : null,
        avgEngagementRate: aggregates._avg.engagementRate
          ? Math.round(aggregates._avg.engagementRate * 100) / 100
          : null,
        lastSyncAt: aggregates._max.syncedAt?.toISOString() || null,
      },
      pagination: { limit, offset, total: totalCount },
    });
  } catch (error) {
    console.error('[x-feed] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
