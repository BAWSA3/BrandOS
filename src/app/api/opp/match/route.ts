import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getClientIdentifier, rateLimiters } from '@/lib/rate-limit';
import supabase from '@/lib/supabase';
import {
  findInteractionBasedOpp,
  type MutualInteractionResult,
} from '@/lib/interaction-scanner';

const SCORE_CHANGE_THRESHOLD = 5;

/**
 * Find a user's opp via interaction-based matching.
 *
 * Flow:
 * 1. Check cache — return same opp if score hasn't changed ±5
 * 2. Scan user's last 100 tweets for top interactors
 * 3. Confirm mutual interaction with top candidates
 * 4. Fall back to archetype + score matching if no interactions found
 */
export async function POST(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    const { limited, resetIn } = checkRateLimit(`opp-match:${clientId}`, rateLimiters.standard);

    if (limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': Math.ceil(resetIn / 1000).toString() } }
      );
    }

    const { username, score, archetype } = (await request.json()) as {
      username: string;
      score: number;
      archetype?: string;
    };

    if (!username || !score) {
      return NextResponse.json({ error: 'username and score are required' }, { status: 400 });
    }

    const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();

    // ── Step 1: Check cache ──────────────────────────────────────────────
    const { data: cached } = await supabase
      .from('OppPairings')
      .select('*')
      .eq('username', cleanUsername)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cached && Math.abs(cached.score_at_match - score) <= SCORE_CHANGE_THRESHOLD) {
      return NextResponse.json({
        rival: cached.opp_username,
        interactionData: cached.interaction_data,
        cached: true,
      });
    }

    // ── Step 2: Interaction-based matching ────────────────────────────────
    const interactionResult = await findInteractionBasedOpp(cleanUsername);

    if (interactionResult) {
      // Cache the pairing
      await cacheOppPairing(
        cleanUsername,
        interactionResult.opp,
        score,
        interactionResult.mutualData
      );

      return NextResponse.json({
        rival: interactionResult.opp,
        interactionData: interactionResult.mutualData,
        cached: false,
      });
    }

    // ── Step 3: Fallback — archetype + score matching ────────────────────
    const fallbackResult = await fallbackMatch(cleanUsername, score, archetype);

    if (fallbackResult) {
      // Cache with zero interaction score
      await cacheOppPairing(cleanUsername, fallbackResult, score, null);

      return NextResponse.json({
        rival: fallbackResult,
        interactionData: null,
        cached: false,
      });
    }

    return NextResponse.json(
      { error: 'No rival found. Try challenging someone specific.' },
      { status: 404 }
    );
  } catch (error) {
    console.error('[opp/match] error:', error);
    return NextResponse.json({ error: 'Failed to find a match' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

async function cacheOppPairing(
  username: string,
  oppUsername: string,
  score: number,
  mutualData: MutualInteractionResult | null
) {
  try {
    await supabase.from('OppPairings').insert({
      username,
      opp_username: oppUsername,
      score_at_match: score,
      opp_score_at_match: 0, // will be filled when matchup runs
      interaction_score: mutualData?.mutualScore || 0,
      interaction_data: mutualData,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (err) {
    console.error('[opp/match] cache write error:', err);
  }
}

// ---------------------------------------------------------------------------
// Fallback: archetype + score matching (original algorithm)
// ---------------------------------------------------------------------------

async function fallbackMatch(
  cleanUsername: string,
  score: number,
  archetype?: string
): Promise<string | null> {
  const tolerance = 10;

  // Try same archetype first
  if (archetype) {
    const { data: sameArchetype } = await supabase
      .from('BrandScans')
      .select('username, score, archetype')
      .gte('score', score - tolerance)
      .lte('score', score + tolerance)
      .neq('username', cleanUsername)
      .eq('archetype', archetype)
      .order('created_at', { ascending: false })
      .limit(50);

    if (sameArchetype && sameArchetype.length > 0) {
      const unique = deduplicateByUsername(sameArchetype);
      const closest = findClosestScore(unique, score);
      if (closest) return closest.username;
    }
  }

  // Any archetype within ±10
  const { data: anyArchetype } = await supabase
    .from('BrandScans')
    .select('username, score, archetype')
    .gte('score', score - tolerance)
    .lte('score', score + tolerance)
    .neq('username', cleanUsername)
    .order('created_at', { ascending: false })
    .limit(50);

  if (anyArchetype && anyArchetype.length > 0) {
    const unique = deduplicateByUsername(anyArchetype);
    const closest = findClosestScore(unique, score);
    if (closest) return closest.username;
  }

  // Wider: ±20
  const { data: wider } = await supabase
    .from('BrandScans')
    .select('username, score, archetype')
    .gte('score', score - 20)
    .lte('score', score + 20)
    .neq('username', cleanUsername)
    .order('created_at', { ascending: false })
    .limit(50);

  if (wider && wider.length > 0) {
    const unique = deduplicateByUsername(wider);
    const closest = findClosestScore(unique, score);
    if (closest) return closest.username;
  }

  return null;
}

function deduplicateByUsername(
  rows: { username: string; score: number; archetype: string | null }[]
): { username: string; score: number }[] {
  const seen = new Map<string, { username: string; score: number }>();
  for (const row of rows) {
    if (!seen.has(row.username)) {
      seen.set(row.username, { username: row.username, score: row.score });
    }
  }
  return Array.from(seen.values());
}

function findClosestScore(
  candidates: { username: string; score: number }[],
  targetScore: number
): { username: string; score: number } | null {
  if (candidates.length === 0) return null;
  const shuffled = candidates.sort(() => Math.random() - 0.5);
  return shuffled.reduce((best, current) => {
    const bestDiff = Math.abs(best.score - targetScore);
    const currentDiff = Math.abs(current.score - targetScore);
    return currentDiff < bestDiff ? current : best;
  });
}
