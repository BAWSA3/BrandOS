import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/db';

async function getAuthenticatedUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  if (!accessToken) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user: authUser }, error } = await supabase.auth.getUser(accessToken);
  if (error || !authUser) return null;

  return prisma.user.findUnique({ where: { supabaseId: authUser.id } });
}

// GET /api/calendar/cadence?brandId=...
export async function GET(request: NextRequest) {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: dbUser.id },
    });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Get current week boundaries (Monday to Sunday)
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(monday.getDate() - day + (day === 0 ? -6 : 1));
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    // Fetch this week's drafts and recent tweet history in parallel
    const [weekDrafts, recentTweets] = await Promise.all([
      prisma.contentDraft.findMany({
        where: { brandId },
        orderBy: { scheduledFor: 'asc' },
      }),
      prisma.brandTweet.findMany({
        where: { brandId },
        orderBy: { postedAt: 'desc' },
        take: 50,
      }),
    ]);

    // Compute this-week stats
    const thisWeekScheduled = weekDrafts.filter(d =>
      d.status === 'scheduled' && d.scheduledFor &&
      d.scheduledFor >= monday && d.scheduledFor <= sunday
    );
    const thisWeekDrafts = weekDrafts.filter(d =>
      d.status === 'draft' && d.scheduledFor &&
      d.scheduledFor >= monday && d.scheduledFor <= sunday
    );
    const thisWeekIdeas = weekDrafts.filter(d => d.status === 'idea');

    // Compute cadence from tweet history
    let postsPerWeek = 0;
    let avgGapDays = 0;
    let busiestDay = '';
    let quietestDay = '';

    if (recentTweets.length > 1) {
      // Time range of tweets
      const oldest = recentTweets[recentTweets.length - 1].postedAt;
      const newest = recentTweets[0].postedAt;
      const weeksSpan = Math.max(1, (newest.getTime() - oldest.getTime()) / (7 * 24 * 60 * 60 * 1000));
      postsPerWeek = Math.round((recentTweets.length / weeksSpan) * 10) / 10;

      // Average gap between tweets
      const gaps: number[] = [];
      for (let i = 0; i < recentTweets.length - 1; i++) {
        const gap = (recentTweets[i].postedAt.getTime() - recentTweets[i + 1].postedAt.getTime()) / (24 * 60 * 60 * 1000);
        gaps.push(gap);
      }
      avgGapDays = Math.round((gaps.reduce((a, b) => a + b, 0) / gaps.length) * 10) / 10;

      // Day distribution
      const dayCount: Record<string, number> = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      recentTweets.forEach(t => {
        dayCount[dayNames[t.postedAt.getDay()]]++;
      });
      const sorted = Object.entries(dayCount).sort((a, b) => b[1] - a[1]);
      busiestDay = sorted[0][0];
      quietestDay = sorted[sorted.length - 1][0];
    }

    // Recommendations
    const recommendations: string[] = [];

    // Check for gaps in this week's schedule
    const scheduledDays = new Set(
      thisWeekScheduled.map(d => d.scheduledFor!.toISOString().split('T')[0])
    );
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const consecutiveEmpty: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      if (!scheduledDays.has(key)) {
        consecutiveEmpty.push(dayNames[d.getDay()]);
      } else {
        if (consecutiveEmpty.length >= 3) {
          recommendations.push(`Gap ahead: ${consecutiveEmpty.join(', ')} have no scheduled posts`);
        }
        consecutiveEmpty.length = 0;
      }
    }
    if (consecutiveEmpty.length >= 3) {
      recommendations.push(`Gap ahead: ${consecutiveEmpty.join(', ')} have no scheduled posts`);
    }

    // Check for overloaded days
    const dayPostCounts: Record<string, number> = {};
    thisWeekScheduled.forEach(d => {
      const key = d.scheduledFor!.toISOString().split('T')[0];
      dayPostCounts[key] = (dayPostCounts[key] || 0) + 1;
    });
    Object.entries(dayPostCounts).forEach(([date, count]) => {
      if (count >= 3) {
        const d = new Date(date);
        recommendations.push(`Heavy: ${dayNames[d.getDay()]} has ${count} posts scheduled`);
      }
    });

    // Consistency tip
    if (postsPerWeek > 0 && thisWeekScheduled.length < Math.floor(postsPerWeek)) {
      recommendations.push(`You typically post ${postsPerWeek}/week. Consider scheduling ${Math.ceil(postsPerWeek) - thisWeekScheduled.length} more.`);
    }

    // Upcoming scheduled posts
    const upcoming = thisWeekScheduled
      .filter(d => d.scheduledFor && d.scheduledFor >= now)
      .slice(0, 2)
      .map(d => ({
        id: d.id,
        content: d.content.slice(0, 100),
        scheduledFor: d.scheduledFor!.toISOString(),
        contentType: d.contentType,
      }));

    return NextResponse.json({
      thisWeek: {
        scheduled: thisWeekScheduled.length,
        drafts: thisWeekDrafts.length,
        ideas: thisWeekIdeas.length,
      },
      cadence: {
        postsPerWeek,
        avgGapDays,
        busiestDay,
        quietestDay,
      },
      recommendations,
      upcoming,
    });
  } catch (error) {
    console.error('[calendar/cadence] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
