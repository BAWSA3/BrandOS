import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import { getUserProfileAsync, getUserStats } from '@/lib/user-profiles';

// =============================================================================
// BrandOS Intelligence Report — Per-User
// =============================================================================
//
// GET /api/intelligence/report?username=handle
//
// Returns a complete intelligence report: archetype identity, phase analysis,
// next moves, evolution roadmap, cohort comparison, and trajectory.
// =============================================================================

interface PhaseScores {
  define: number;
  check: number;
  generate: number;
  scale: number;
}

const PHASE_LABELS: Record<string, string> = {
  define: 'Define',
  check: 'Check',
  generate: 'Generate',
  scale: 'Scale',
};

const PHASE_DESCRIPTIONS: Record<string, string> = {
  define: 'What you\'re known for — content pillars, niche clarity, audience understanding',
  check: 'Voice consistency — tone, style, on-brand focus across posts',
  generate: 'Content quality & output — volume, format effectiveness, originality',
  scale: 'Reputation signals — follower ratio, authority indicators, growth trajectory',
};

function safeJsonParse<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')?.toLowerCase().replace(/^@/, '');

  if (!username) {
    return NextResponse.json({ error: 'Missing username parameter' }, { status: 400 });
  }

  // Allow card page to request public-safe fields (strengths, summary)
  const includePublic = request.nextUrl.searchParams.get('include') === 'public';

  // TODO: Re-enable paywall when ready to charge
  const isPro = true;

  try {
    // Get user's scan history (latest first)
    const { data: userScans, error: userError } = await supabase
      .from('BrandScans')
      .select('*')
      .eq('username', username)
      .order('created_at', { ascending: false })
      .limit(20);

    if (userError) {
      console.error('[Intelligence] User scan query error:', userError);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    if (!userScans || userScans.length === 0) {
      return NextResponse.json({ error: `No scans found for @${username}. Run a scan first at mybrandos.app` }, { status: 404 });
    }

    const latestScan = userScans[0];
    const archetype = latestScan.archetype?.toUpperCase() || 'UNKNOWN';
    const archetypeInfo = getArchetypeInfo(archetype);

    // Parse latest scan intelligence
    const latestPhases = safeJsonParse<PhaseScores>(latestScan.phase_scores);
    const latestInsights = safeJsonParse<Record<string, string[]>>(latestScan.insights);
    const latestStrengths = safeJsonParse<string[]>(latestScan.strengths);
    const latestImprovements = safeJsonParse<string[]>(latestScan.improvements);
    const latestNextMoves = safeJsonParse<string[]>(latestScan.next_moves);
    const latestContentPillars = safeJsonParse<string[]>(latestScan.content_pillars);

    // Fetch user profile for evolution + stats
    const userProfile = await getUserProfileAsync(username);
    const userStats = userProfile ? getUserStats(username) : null;

    // Build score trajectory from history
    const trajectory = userScans
      .filter((s) => s.score != null)
      .map((s) => ({
        score: s.score,
        archetype: s.archetype,
        date: s.created_at,
      }))
      .reverse();

    // Get cohort data for comparison
    const { data: cohortScans } = await supabase
      .from('BrandScans')
      .select('score, phase_scores')
      .eq('archetype', archetype)
      .not('phase_scores', 'is', null)
      .limit(1000);

    // Parse cohort phase data
    const cohortParsed: { score: number; phases: PhaseScores }[] = [];
    if (cohortScans) {
      for (const scan of cohortScans) {
        try {
          const phases = JSON.parse(scan.phase_scores) as PhaseScores;
          if (phases.define != null) {
            cohortParsed.push({ score: scan.score, phases });
          }
        } catch { /* skip */ }
      }
    }

    const avg = (arr: number[]) =>
      arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

    // Cohort averages
    const cohortAvgScore = avg(cohortParsed.map((c) => c.score));
    const cohortAvgPhases = cohortParsed.length > 0
      ? {
          define: avg(cohortParsed.map((c) => c.phases.define)),
          check: avg(cohortParsed.map((c) => c.phases.check)),
          generate: avg(cohortParsed.map((c) => c.phases.generate)),
          scale: avg(cohortParsed.map((c) => c.phases.scale)),
        }
      : null;

    // Percentile
    let percentile: number | null = null;
    if (cohortParsed.length >= 5) {
      const belowCount = cohortParsed.filter((c) => c.score < latestScan.score).length;
      percentile = Math.round((belowCount / cohortParsed.length) * 100);
    }

    // Phase comparison vs cohort
    let phaseComparison: { phase: string; label: string; description: string; user: number; cohort: number; delta: number }[] | null = null;
    if (latestPhases && cohortAvgPhases) {
      phaseComparison = (Object.keys(latestPhases) as (keyof PhaseScores)[]).map((phase) => ({
        phase,
        label: PHASE_LABELS[phase] || phase,
        description: PHASE_DESCRIPTIONS[phase] || '',
        user: latestPhases[phase],
        cohort: cohortAvgPhases[phase],
        delta: latestPhases[phase] - cohortAvgPhases[phase],
      }));
    }

    // Critical gap
    let criticalGap: { weakest: string; weakestPhase: string; weakestScore: number; strongest: string; strongestPhase: string; strongestScore: number; gap: number } | null = null;
    if (latestPhases) {
      const phaseEntries = Object.entries(latestPhases) as [string, number][];
      const sorted = [...phaseEntries].sort((a, b) => b[1] - a[1]);
      criticalGap = {
        strongest: PHASE_LABELS[sorted[0][0]],
        strongestPhase: sorted[0][0],
        strongestScore: sorted[0][1],
        weakest: PHASE_LABELS[sorted[sorted.length - 1][0]],
        weakestPhase: sorted[sorted.length - 1][0],
        weakestScore: sorted[sorted.length - 1][1],
        gap: sorted[0][1] - sorted[sorted.length - 1][1],
      };
    }

    // Breakout patterns
    const highScorers = cohortParsed.filter((c) => c.score >= 75);
    let breakoutPatterns: { sampleSize: number; keyDifference: { phase: string; label: string; delta: number }; insight: string } | null = null;
    if (highScorers.length >= 3 && cohortAvgPhases) {
      const highAvg = {
        define: avg(highScorers.map((h) => h.phases.define)),
        check: avg(highScorers.map((h) => h.phases.check)),
        generate: avg(highScorers.map((h) => h.phases.generate)),
        scale: avg(highScorers.map((h) => h.phases.scale)),
      };

      const diffs = (Object.keys(highAvg) as (keyof PhaseScores)[]).map((phase) => ({
        phase,
        label: PHASE_LABELS[phase],
        delta: highAvg[phase] - cohortAvgPhases[phase],
      }));

      const biggest = diffs.sort((a, b) => b.delta - a.delta)[0];

      breakoutPatterns = {
        sampleSize: highScorers.length,
        keyDifference: biggest,
        insight: `${archetypeInfo?.name || archetype}s who scored 75+ had ${biggest.label} scores ${biggest.delta}pts above average. This was the biggest differentiator.`,
      };
    }

    // Cohort size
    const { data: cohortUsernames } = await supabase
      .from('BrandScans')
      .select('username')
      .eq('archetype', archetype);
    const cohortSize = new Set(cohortUsernames?.map((s) => s.username) || []).size;

    // Meta: staleness + stats
    const daysSinceLastScan = latestScan.created_at
      ? Math.floor((Date.now() - new Date(latestScan.created_at).getTime()) / 86400000)
      : null;

    return NextResponse.json({
      username,
      tier: isPro ? 'pro' : 'free',
      report: {
        // Archetype identity
        archetype: {
          name: archetype,
          emoji: archetypeInfo?.emoji || '',
          tagline: archetypeInfo?.tagline || '',
          description: archetypeInfo?.description || '',
          tier: archetypeInfo?.tier || 0,
          tierLabel: archetypeInfo?.tierLabel || '',
          color: archetypeInfo?.color || '#0047FF',
          strengths: archetypeInfo?.strengths || [],
          traits: archetypeInfo?.traits || [],
          rarity: archetypeInfo?.rarity || 0,
          evolutionPaths: archetypeInfo?.evolutionPaths || [],
        },

        // Score
        score: {
          current: latestScan.score,
          percentile,
          cohortAverage: cohortAvgScore,
          cohortSize,
          influenceTier: latestScan.influence_tier || 'emerging',
        },

        // Phase breakdown
        phases: latestPhases
          ? {
              scores: latestPhases,
              insights: latestInsights,
              comparison: phaseComparison,
              criticalGap,
            }
          : null,

        // Strengths + improvements
        strengths: (isPro || includePublic) ? latestStrengths : null,
        improvements: isPro ? latestImprovements : null,
        summary: (isPro || includePublic) ? latestScan.summary : null,

        // Next moves (action items from Gemini)
        nextMoves: latestNextMoves,

        // Content pillars
        contentPillars: latestContentPillars,

        // Pattern intelligence
        patterns: {
          breakout: breakoutPatterns,
        },

        // Evolution roadmap
        evolution: {
          currentTier: archetypeInfo?.tier || 0,
          possiblePaths: archetypeInfo?.evolutionPaths || [],
          archetypeHistory: userProfile?.archetypeHistory || [],
          daysSinceArchetypeChange: userStats?.daysSinceArchetypeChange ?? null,
        },

        // Score trajectory
        trajectory,

        // Meta
        meta: {
          scannedAt: latestScan.created_at,
          totalScans: userScans.length,
          daysSinceFirstScan: userStats?.daysSinceFirstScan ?? null,
          daysSinceLastScan,
          scoreChange: userStats?.scoreChange ?? null,
          averageScore: userStats?.averageScore ?? null,
          isStale: daysSinceLastScan != null && daysSinceLastScan > 7,
        },
      },
    });
  } catch (err) {
    console.error('[Intelligence] Report error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
