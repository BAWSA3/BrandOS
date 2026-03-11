import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/db';
import Anthropic from '@anthropic-ai/sdk';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';

export const maxDuration = 60;

async function handlePost(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;
    if (!supabaseUrl || !supabaseAnonKey || !anthropicKey) {
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

    const body = await request.json();
    const { brandId, currentFollowers: inputFollowers, targetFollowers, deadlineMonths } = body;

    if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 });

    const brand = await prisma.brand.findFirst({ where: { id: brandId, userId: dbUser.id } });
    if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

    // Gather all intelligence data
    const [gapAnalysis, snapshot7d, snapshot3d, snapshot30d, recentTweets, benchmarks] = await Promise.all([
      prisma.gapAnalysis.findFirst({
        where: { brandId },
        orderBy: { computedAt: 'desc' },
      }),
      prisma.performanceSnapshot.findFirst({
        where: { brandId, windowDays: 7 },
        orderBy: { computedAt: 'desc' },
      }),
      prisma.performanceSnapshot.findFirst({
        where: { brandId, windowDays: 3 },
        orderBy: { computedAt: 'desc' },
      }),
      prisma.performanceSnapshot.findFirst({
        where: { brandId, windowDays: 30 },
        orderBy: { computedAt: 'desc' },
      }),
      prisma.brandTweet.findMany({
        where: { brandId },
        orderBy: { postedAt: 'desc' },
        take: 20,
      }),
      prisma.viralBenchmark.findMany({
        where: { brandId },
        orderBy: { viralScore: 'desc' },
        take: 10,
      }),
    ]);

    // Get follower count from request or default
    const currentFollowers = inputFollowers ?? 1000;
    const target = targetFollowers ?? Math.round(currentFollowers * 1.5);
    const months = deadlineMonths || 4;

    // Build performance context
    const perfContext = snapshot7d ? `
7-DAY PERFORMANCE:
- Posts: ${snapshot7d.totalPosts}
- Avg engagement rate: ${snapshot7d.avgEngagementRate}%
- Total impressions: ${snapshot7d.totalImpressions}
- Total likes: ${snapshot7d.totalLikes}
- Total retweets: ${snapshot7d.totalRetweets}
- Total replies: ${snapshot7d.totalReplies}
- Best hour: ${snapshot7d.bestPostingHour ?? 'unknown'}
- Best day: ${snapshot7d.bestPostingDay ?? 'unknown'}
- Avg post length: ${snapshot7d.avgPostLength ?? 'unknown'}` : '';

    const perf3d = snapshot3d ? `
3-DAY PERFORMANCE:
- Avg engagement rate: ${snapshot3d.avgEngagementRate}%
- Total impressions: ${snapshot3d.totalImpressions}` : '';

    // Build tweet context
    const tweetContext = recentTweets.map((t, i) => {
      let m: Record<string, number> = {};
      try { m = JSON.parse(t.metrics); } catch { /* use default */ }
      const truncatedText = t.text.length > 200 ? t.text.substring(0, 200) + '...' : t.text;
      return `[${i + 1}] ${truncatedText}\n    ${m.likes || 0}L / ${m.retweets || 0}RT / ${m.replies || 0}R / ${m.impressions || 0} imp`;
    }).join('\n\n');

    // Build gap context
    const gapContext = gapAnalysis ? `
GAP ANALYSIS (latest):
- Overall: ${gapAnalysis.overallGapScore}/100
- Hook Strength: ${gapAnalysis.hookStrength}/100
- Format Match: ${gapAnalysis.formatMatch}/100
- Tone Alignment: ${gapAnalysis.toneAlignment}/100
- CTA Effectiveness: ${gapAnalysis.ctaEffectiveness}/100
- Engagement Velocity: ${gapAnalysis.engagementVelocity}/100
- Posting Consistency: ${gapAnalysis.postingConsistency}/100
- Strengths: ${gapAnalysis.strengths}
- Gaps: ${gapAnalysis.gaps}
- Action Items: ${gapAnalysis.actionItems}` : '';

    // Build benchmark context
    const benchmarkContext = benchmarks.length > 0
      ? benchmarks.map((b, i) => {
          let p: Record<string, string> = {};
          let m: Record<string, number> = {};
          try { p = JSON.parse(b.patterns); } catch { /* use default */ }
          try { m = JSON.parse(b.metrics); } catch { /* use default */ }
          return `[${i + 1}] score:${b.viralScore} | hook:${p.hookType} format:${p.format} cta:${p.cta} | ${m.like_count || 0}L ${m.retweet_count || 0}RT`;
        }).join('\n')
      : '';

    const anthropic = new Anthropic({ apiKey: anthropicKey });

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: `You are a brand growth strategist. Generate a personalized, data-driven growth plan.

CREATOR: ${brand.name}
CURRENT FOLLOWERS: ${currentFollowers.toLocaleString()}
TARGET: ${target.toLocaleString()} followers
DEADLINE: ${months} months
NEEDED: ${Math.round((target - currentFollowers) / months).toLocaleString()}/month = ~${Math.round((target - currentFollowers) / (months * 30))}/day

${perfContext}
${perf3d}
${gapContext}

RECENT TWEETS (last 20):
${tweetContext}

VIRAL BENCHMARKS IN NICHE:
${benchmarkContext}

Generate a comprehensive growth plan. Return ONLY valid JSON:
{
  "strengths": [
    { "metric": "metric name", "value": "their number", "benchmark": "what good looks like", "verdict": "one word verdict" }
  ],
  "bottleneck": {
    "title": "main problem in 5 words",
    "description": "2-3 sentence explanation of why this is the #1 bottleneck",
    "keyMetrics": [
      { "metric": "metric name", "current": "current value", "target": "target value" }
    ]
  },
  "levers": [
    {
      "title": "lever name",
      "impact": "highest|high|medium-high|medium",
      "score": 0-100,
      "description": "why this matters in 2 sentences",
      "actionItems": ["specific action 1", "specific action 2", "specific action 3", "specific action 4"],
      "target": "specific measurable target"
    }
  ],
  "weeklyPlan": [
    { "day": "Mon", "content": "what to post", "format": "format type", "ctaType": "CTA type" }
  ],
  "milestones": [
    { "month": "month name", "targetFollowers": number, "growth": number, "focus": "primary focus", "metric": "success metric" }
  ],
  "stopDoing": ["thing to stop 1", "thing to stop 2", "thing to stop 3"],
  "dailyNonNegotiables": ["daily task 1", "daily task 2", "daily task 3"],
  "oneThingThatMatters": "the single most important insight in 2 sentences"
}

Rules:
- Every number must be based on real data provided above
- Levers should be ordered by impact (highest first)
- Each lever should directly address a gap from the gap analysis
- Action items must be specific and actionable, not generic
- Milestones should have realistic monthly targets based on compound growth
- The bottleneck should identify THE key thing holding growth back
- Be direct. No fluff. Data > feelings.`,
      }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 });
    }

    let plan;
    try {
      plan = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: 'Failed to parse plan' }, { status: 500 });
    }

    if (!plan.strengths || !plan.levers || !plan.milestones) {
      return NextResponse.json({ error: 'Incomplete plan generated' }, { status: 500 });
    }

    // Add computed fields
    plan.currentFollowers = currentFollowers;
    plan.targetFollowers = target;
    plan.deadlineMonths = months;
    plan.dailyNeeded = Math.round((target - currentFollowers) / (months * 30));
    plan.monthlyNeeded = Math.round((target - currentFollowers) / months);
    plan.gapScores = gapAnalysis ? {
      hookStrength: gapAnalysis.hookStrength,
      formatMatch: gapAnalysis.formatMatch,
      toneAlignment: gapAnalysis.toneAlignment,
      ctaEffectiveness: gapAnalysis.ctaEffectiveness,
      engagementVelocity: gapAnalysis.engagementVelocity,
      postingConsistency: gapAnalysis.postingConsistency,
      overall: gapAnalysis.overallGapScore,
    } : null;
    plan.engagementRate7d = snapshot7d?.avgEngagementRate || null;
    plan.engagementRate3d = snapshot3d?.avgEngagementRate || null;

    return NextResponse.json({ plan });
  } catch (error) {
    console.error('[growth-plan] Generate error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePost, rateLimiters.aiStrict);
