import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

// =============================================================================
// BrandOS Intelligence — Archetype Cohort Aggregation
// =============================================================================
//
// GET /api/intelligence/cohort?archetype=BUILD.EXE
//
// Returns aggregate stats for an archetype cohort:
// - Average phase scores
// - Score distribution (percentiles)
// - Total creators in cohort
// - Phase patterns (which phases are strongest/weakest for this archetype)
// =============================================================================

interface PhaseScores {
  define: number;
  check: number;
  generate: number;
  scale: number;
}

export async function GET(request: NextRequest) {
  const archetype = request.nextUrl.searchParams.get('archetype')?.toUpperCase();

  if (!archetype) {
    return NextResponse.json({ error: 'Missing archetype parameter' }, { status: 400 });
  }

  try {
    // Fetch all scans for this archetype that have phase data
    const { data: scans, error } = await supabase
      .from('BrandScans')
      .select('score, phase_scores, influence_tier')
      .eq('archetype', archetype)
      .not('phase_scores', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      console.error('[Intelligence] Cohort query error:', error);
      return NextResponse.json({ error: 'Failed to query cohort data' }, { status: 500 });
    }

    // Also get total count for this archetype (including those without phase data)
    const { count: totalScans } = await supabase
      .from('BrandScans')
      .select('*', { count: 'exact', head: true })
      .eq('archetype', archetype);

    // Get unique creators count
    const { data: allScans } = await supabase
      .from('BrandScans')
      .select('username')
      .eq('archetype', archetype);

    const uniqueCreators = new Set(allScans?.map((s) => s.username) || []).size;

    if (!scans || scans.length === 0) {
      return NextResponse.json({
        archetype,
        totalScans: totalScans || 0,
        uniqueCreators,
        withPhaseData: 0,
        averageScore: 0,
        averagePhases: null,
        scoreDistribution: null,
        phasePatterns: null,
        message: 'No phase data yet — intelligence builds as more scans come in',
      });
    }

    // Parse phase scores
    const parsed: { score: number; phases: PhaseScores }[] = [];
    for (const scan of scans) {
      try {
        const phases = JSON.parse(scan.phase_scores) as PhaseScores;
        if (phases.define != null && phases.check != null) {
          parsed.push({ score: scan.score, phases });
        }
      } catch {
        // Skip malformed entries
      }
    }

    if (parsed.length === 0) {
      return NextResponse.json({
        archetype,
        totalScans: totalScans || 0,
        uniqueCreators,
        withPhaseData: 0,
        averageScore: 0,
        averagePhases: null,
        scoreDistribution: null,
        phasePatterns: null,
        message: 'Phase data is accumulating — check back soon',
      });
    }

    // Compute averages
    const avg = (arr: number[]) => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);

    const scores = parsed.map((p) => p.score);
    const averageScore = avg(scores);

    const averagePhases = {
      define: avg(parsed.map((p) => p.phases.define)),
      check: avg(parsed.map((p) => p.phases.check)),
      generate: avg(parsed.map((p) => p.phases.generate)),
      scale: avg(parsed.map((p) => p.phases.scale)),
    };

    // Score distribution (percentiles)
    const sorted = [...scores].sort((a, b) => a - b);
    const percentile = (p: number) => sorted[Math.floor((p / 100) * sorted.length)] || 0;

    const scoreDistribution = {
      p10: percentile(10),
      p25: percentile(25),
      p50: percentile(50),
      p75: percentile(75),
      p90: percentile(90),
      min: sorted[0],
      max: sorted[sorted.length - 1],
    };

    // Phase patterns: rank phases by average score
    const phaseEntries = Object.entries(averagePhases) as [string, number][];
    const sortedPhases = [...phaseEntries].sort((a, b) => b[1] - a[1]);

    const phasePatterns = {
      strongest: sortedPhases[0][0],
      strongestScore: sortedPhases[0][1],
      weakest: sortedPhases[sortedPhases.length - 1][0],
      weakestScore: sortedPhases[sortedPhases.length - 1][1],
      gap: sortedPhases[0][1] - sortedPhases[sortedPhases.length - 1][1],
    };

    // Influence tier breakdown
    const tierCounts: Record<string, number> = {};
    for (const scan of scans) {
      if (scan.influence_tier) {
        tierCounts[scan.influence_tier] = (tierCounts[scan.influence_tier] || 0) + 1;
      }
    }

    // Breakout analysis: what do high scorers (75+) do differently?
    const highScorers = parsed.filter((p) => p.score >= 75);
    const breakoutPhases = highScorers.length >= 3
      ? {
          sampleSize: highScorers.length,
          averagePhases: {
            define: avg(highScorers.map((p) => p.phases.define)),
            check: avg(highScorers.map((p) => p.phases.check)),
            generate: avg(highScorers.map((p) => p.phases.generate)),
            scale: avg(highScorers.map((p) => p.phases.scale)),
          },
          biggestDiffFromCohort: (() => {
            const diffs = {
              define: avg(highScorers.map((p) => p.phases.define)) - averagePhases.define,
              check: avg(highScorers.map((p) => p.phases.check)) - averagePhases.check,
              generate: avg(highScorers.map((p) => p.phases.generate)) - averagePhases.generate,
              scale: avg(highScorers.map((p) => p.phases.scale)) - averagePhases.scale,
            };
            const biggest = Object.entries(diffs).sort((a, b) => b[1] - a[1])[0];
            return { phase: biggest[0], delta: biggest[1] };
          })(),
        }
      : null;

    return NextResponse.json({
      archetype,
      totalScans: totalScans || 0,
      uniqueCreators,
      withPhaseData: parsed.length,
      averageScore,
      averagePhases,
      scoreDistribution,
      phasePatterns,
      tierBreakdown: tierCounts,
      breakoutAnalysis: breakoutPhases,
    });
  } catch (err) {
    console.error('[Intelligence] Cohort error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
