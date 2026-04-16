import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/lib/supabase';

/**
 * Global Opp Leaderboard — "Most Targeted Opps"
 *
 * Counts how many times each user has appeared in a matchup (as either user1 or user2).
 * Returns top 10 most-matched users with their matchup count and win rate.
 */

interface LeaderboardEntry {
  username: string;
  matchupCount: number;
  wins: number;
  losses: number;
  winRate: number;
  avgScore: number;
}

export async function GET(request: NextRequest) {
  try {
    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get('limit') || '10'),
      25
    );

    // Fetch all matchups (last 30 days for relevance)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: matchups, error } = await supabase
      .from('OppMatchups')
      .select('user1_username, user2_username, user1_score, user2_score, winner_username')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error || !matchups) {
      return NextResponse.json({ leaderboard: [], totalMatchups: 0 });
    }

    // Aggregate per user
    const stats = new Map<string, { matchups: number; wins: number; totalScore: number }>();

    for (const m of matchups) {
      for (const username of [m.user1_username, m.user2_username]) {
        if (!stats.has(username)) {
          stats.set(username, { matchups: 0, wins: 0, totalScore: 0 });
        }
        const entry = stats.get(username)!;
        entry.matchups++;
        if (m.winner_username === username) entry.wins++;
        entry.totalScore += username === m.user1_username ? m.user1_score : m.user2_score;
      }
    }

    // Sort by matchup count and build leaderboard
    const leaderboard: LeaderboardEntry[] = Array.from(stats.entries())
      .sort((a, b) => b[1].matchups - a[1].matchups)
      .slice(0, limit)
      .map(([username, data]) => ({
        username,
        matchupCount: data.matchups,
        wins: data.wins,
        losses: data.matchups - data.wins,
        winRate: Math.round((data.wins / data.matchups) * 100),
        avgScore: Math.round(data.totalScore / data.matchups),
      }));

    return NextResponse.json({
      leaderboard,
      totalMatchups: matchups.length,
    });
  } catch (error) {
    console.error('[opp/leaderboard] error:', error);
    return NextResponse.json({ leaderboard: [], totalMatchups: 0 });
  }
}
