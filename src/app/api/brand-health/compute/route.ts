import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import Anthropic from '@anthropic-ai/sdk';
import prisma from '@/lib/db';
import { BrandDNA } from '@/lib/types';
import {
  computeCompleteness,
  computeConsistency,
  computeVoiceMatch,
  computeEngagement,
  computeActivity,
  computeOverallScore,
  computeTrend,
  type AvailableDataFlags,
} from '@/lib/brand-health';

async function getAuthUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  if (!accessToken) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) return null;

  return prisma.user.findUnique({ where: { supabaseId: user.id } });
}

// POST /api/brand-health/compute — Compute + persist a new snapshot
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brandId } = await request.json();
    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    // Verify ownership
    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
    });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Rate limit: 1 compute per hour per brand
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSnapshot = await prisma.brandHealthSnapshot.findFirst({
      where: { brandId, createdAt: { gte: oneHourAgo } },
      orderBy: { createdAt: 'desc' },
    });
    if (recentSnapshot) {
      return NextResponse.json({
        snapshot: recentSnapshot,
        cached: true,
      });
    }

    // Parse brand data into BrandDNA shape
    const brandDNA: BrandDNA = {
      id: brand.id,
      name: brand.name,
      colors: JSON.parse(brand.colors),
      tone: JSON.parse(brand.tone),
      keywords: JSON.parse(brand.keywords),
      doPatterns: JSON.parse(brand.doPatterns),
      dontPatterns: JSON.parse(brand.dontPatterns),
      voiceSamples: JSON.parse(brand.voiceSamples),
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    };

    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Fetch data in parallel
    const [checkEntries, allHistoryEntries, posts, previousSnapshot] = await Promise.all([
      // Last 20 check entries for consistency
      prisma.historyEntry.findMany({
        where: { brandId, type: 'check', score: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: { score: true },
      }),
      // All history entries in last 14 days for activity
      prisma.historyEntry.findMany({
        where: { brandId, createdAt: { gte: fourteenDaysAgo } },
        select: { id: true },
      }),
      // Fetch X posts via internal API (reuse dashboard posts endpoint logic)
      fetchXPosts(request),
      // Previous snapshot for trend (7 days ago or most recent before that)
      prisma.brandHealthSnapshot.findFirst({
        where: {
          brandId,
          createdAt: { lt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
        select: { overallScore: true },
      }),
    ]);

    // Compute each dimension
    const completeness = computeCompleteness(brandDNA);
    const consistency = computeConsistency(checkEntries);
    const activity = computeActivity(allHistoryEntries.length);

    // Voice match requires Claude call
    let voiceMatch = 0;
    const postTexts = posts.map((p: { text: string }) => p.text);
    if (postTexts.length > 0 && process.env.ANTHROPIC_API_KEY) {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      voiceMatch = await computeVoiceMatch(postTexts, brandDNA, async (prompt) => {
        const message = await anthropic.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 256,
          messages: [{ role: 'user', content: prompt }],
        });
        return message.content[0].type === 'text' ? message.content[0].text : '';
      });
    }

    const engagement = computeEngagement(posts);

    const flags: AvailableDataFlags = {
      hasCheckEntries: checkEntries.length >= 3,
      hasPosts: posts.length > 0,
    };

    const dimensions = { completeness, consistency, voiceMatch, engagement, activity };
    const overallScore = computeOverallScore(dimensions, flags);
    const trend = computeTrend(overallScore, previousSnapshot?.overallScore ?? null);

    // Persist snapshot
    const snapshot = await prisma.brandHealthSnapshot.create({
      data: {
        overallScore,
        completeness,
        consistency,
        voiceMatch,
        engagement,
        activity,
        trendDirection: trend.direction,
        trendDelta: trend.delta,
        computationData: JSON.stringify({
          checkEntriesCount: checkEntries.length,
          postsCount: posts.length,
          activityCount: allHistoryEntries.length,
          flags,
          weights: flags,
        }),
        periodStart: fourteenDaysAgo,
        periodEnd: now,
        brandId,
      },
    });

    return NextResponse.json({ snapshot, cached: false });
  } catch (error) {
    console.error('[BrandHealth Compute] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper: fetch X posts (reuse logic from dashboard/posts)
async function fetchXPosts(request: NextRequest) {
  try {
    const origin = new URL(request.url).origin;
    const res = await fetch(`${origin}/api/dashboard/posts`, {
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.posts || [];
  } catch {
    return [];
  }
}
