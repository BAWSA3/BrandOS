import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/db';

// ─── Thresholds ───
const DIMENSION_DROP_WARNING = 5;
const DIMENSION_DROP_CRITICAL = 10;
const LOW_ALIGNMENT_THRESHOLD = 50;
const LOW_ALIGNMENT_STREAK = 3;
const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

const DIMENSIONS = ['completeness', 'consistency', 'voiceMatch', 'engagement', 'activity'] as const;

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

function dimensionLabel(dim: string): string {
  const labels: Record<string, string> = {
    completeness: 'Completeness',
    consistency: 'Consistency',
    voiceMatch: 'Voice Match',
    engagement: 'Engagement',
    activity: 'Activity',
    overall: 'Overall Score',
  };
  return labels[dim] || dim;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { brandId } = await request.json();

    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
    });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const newAlerts: { type: string; severity: string; metric: string; previousScore: number; currentScore: number; delta: number; message: string }[] = [];

    // ─── 1. Compare latest 2 snapshots ───
    const snapshots = await prisma.brandHealthSnapshot.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });

    if (snapshots.length === 2) {
      const [current, previous] = snapshots;

      // Check each dimension
      for (const dim of DIMENSIONS) {
        const prev = previous[dim];
        const curr = current[dim];
        const drop = prev - curr;

        if (drop >= DIMENSION_DROP_CRITICAL) {
          newAlerts.push({
            type: 'dimension_drop',
            severity: 'critical',
            metric: dim,
            previousScore: prev,
            currentScore: curr,
            delta: drop,
            message: `${dimensionLabel(dim)} dropped ${drop} points (${prev} → ${curr})`,
          });
        } else if (drop >= DIMENSION_DROP_WARNING) {
          newAlerts.push({
            type: 'dimension_drop',
            severity: 'warning',
            metric: dim,
            previousScore: prev,
            currentScore: curr,
            delta: drop,
            message: `${dimensionLabel(dim)} dropped ${drop} points (${prev} → ${curr})`,
          });
        }
      }

      // Check overall score drop
      const overallDrop = previous.overallScore - current.overallScore;
      if (overallDrop >= DIMENSION_DROP_CRITICAL) {
        newAlerts.push({
          type: 'overall_drop',
          severity: 'critical',
          metric: 'overall',
          previousScore: previous.overallScore,
          currentScore: current.overallScore,
          delta: overallDrop,
          message: `Overall Brand Score dropped ${overallDrop} points (${previous.overallScore} → ${current.overallScore})`,
        });
      } else if (overallDrop >= DIMENSION_DROP_WARNING) {
        newAlerts.push({
          type: 'overall_drop',
          severity: 'warning',
          metric: 'overall',
          previousScore: previous.overallScore,
          currentScore: current.overallScore,
          delta: overallDrop,
          message: `Overall Brand Score dropped ${overallDrop} points (${previous.overallScore} → ${current.overallScore})`,
        });
      }
    }

    // ─── 2. Check for low alignment streak ───
    const recentTweets = await prisma.brandTweet.findMany({
      where: { brandId, alignmentScore: { not: null } },
      orderBy: { postedAt: 'desc' },
      take: LOW_ALIGNMENT_STREAK,
      select: { alignmentScore: true },
    });

    if (recentTweets.length >= LOW_ALIGNMENT_STREAK) {
      const allLow = recentTweets.every(t => (t.alignmentScore ?? 100) < LOW_ALIGNMENT_THRESHOLD);
      if (allLow) {
        const avgScore = Math.round(
          recentTweets.reduce((sum, t) => sum + (t.alignmentScore ?? 0), 0) / recentTweets.length
        );
        newAlerts.push({
          type: 'low_alignment',
          severity: avgScore < 30 ? 'critical' : 'warning',
          metric: 'alignment',
          previousScore: LOW_ALIGNMENT_THRESHOLD,
          currentScore: avgScore,
          delta: LOW_ALIGNMENT_THRESHOLD - avgScore,
          message: `Last ${LOW_ALIGNMENT_STREAK} tweets scored below ${LOW_ALIGNMENT_THRESHOLD}% alignment (avg: ${avgScore}%)`,
        });
      }
    }

    // ─── 3. Dedup: skip alerts for same metric+type within 24h ───
    const cutoff = new Date(Date.now() - DEDUP_WINDOW_MS);
    const recentAlerts = await prisma.driftAlert.findMany({
      where: {
        brandId,
        createdAt: { gte: cutoff },
      },
      select: { type: true, metric: true },
    });

    const existingKeys = new Set(recentAlerts.map(a => `${a.type}:${a.metric}`));
    const dedupedAlerts = newAlerts.filter(a => !existingKeys.has(`${a.type}:${a.metric}`));

    // ─── 4. Create alerts ───
    const created = [];
    for (const alert of dedupedAlerts) {
      const record = await prisma.driftAlert.create({
        data: { ...alert, brandId },
      });
      created.push(record);
    }

    return NextResponse.json({
      alerts: created,
      newCount: created.length,
    });
  } catch (err) {
    console.error('Drift detection failed:', err);
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 });
  }
}
