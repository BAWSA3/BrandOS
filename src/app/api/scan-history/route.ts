import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import supabase from '@/lib/supabase';

/**
 * GET /api/scan-history?username=xxx
 *
 * Returns scan history for the given username (session-auth for dashboard).
 * Falls back to the authenticated user's xUsername if no query param.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username') || user?.xUsername;

    if (!username) {
      return NextResponse.json({ error: 'Username required' }, { status: 400 });
    }

    const { data: scans, error } = await supabase
      .from('BrandScans')
      .select('id, username, score, archetype, phase_scores, created_at')
      .eq('username', username.toLowerCase())
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('[ScanHistory] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }

    if (!scans || scans.length === 0) {
      return NextResponse.json({
        username,
        scans: [],
        stats: null,
        deltas: null,
      });
    }

    // Parse phase scores from JSON strings
    const parsed = scans.map((s) => ({
      score: s.score,
      archetype: s.archetype,
      phaseScores: s.phase_scores ? JSON.parse(s.phase_scores) : null,
      createdAt: s.created_at,
    }));

    // Compute stats
    const scores = parsed.map((s) => s.score);
    const stats = {
      totalScans: parsed.length,
      highScore: Math.max(...scores),
      lowScore: Math.min(...scores),
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      currentScore: parsed[parsed.length - 1].score,
      firstScan: parsed[0].createdAt,
      lastScan: parsed[parsed.length - 1].createdAt,
    };

    // Compute deltas between two most recent scans
    let deltas: Record<string, number> | null = null;
    if (parsed.length >= 2) {
      const current = parsed[parsed.length - 1];
      const previous = parsed[parsed.length - 2];
      deltas = {
        overall: current.score - previous.score,
      };
      if (current.phaseScores && previous.phaseScores) {
        deltas.define = (current.phaseScores.define ?? 0) - (previous.phaseScores.define ?? 0);
        deltas.check = (current.phaseScores.check ?? 0) - (previous.phaseScores.check ?? 0);
        deltas.generate =
          (current.phaseScores.generate ?? 0) - (previous.phaseScores.generate ?? 0);
        deltas.scale = (current.phaseScores.scale ?? 0) - (previous.phaseScores.scale ?? 0);
      }
    }

    return NextResponse.json({
      username,
      scans: parsed,
      stats,
      deltas,
    });
  } catch (error) {
    console.error('[ScanHistory] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
