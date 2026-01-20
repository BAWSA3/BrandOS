import { NextRequest, NextResponse } from 'next/server';
import {
  getUserProfile,
  getArchetypeHistory,
  getUserStats,
  normalizeUsername,
} from '@/lib/user-profiles';
import { getEvolutionInfo, getArchetypeDefinitions } from '@/lib/archetype-engine';

/**
 * Archetype API - Query archetype history and evolution info
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get('username');
  const action = searchParams.get('action');

  // Get all archetype definitions
  if (action === 'definitions') {
    return NextResponse.json({
      archetypes: getArchetypeDefinitions(),
    });
  }

  if (!username) {
    return NextResponse.json(
      { error: 'Username is required' },
      { status: 400 }
    );
  }

  const normalized = normalizeUsername(username);
  const profile = getUserProfile(normalized);

  if (!profile) {
    return NextResponse.json(
      { error: 'User not found', username: normalized },
      { status: 404 }
    );
  }

  const history = getArchetypeHistory(normalized);
  const stats = getUserStats(normalized);
  const evolutionInfo = getEvolutionInfo(normalized);

  return NextResponse.json({
    username: profile.username,
    displayName: profile.displayName,
    currentArchetype: profile.archetype,
    archetypeHistory: history,
    stats: {
      ...stats,
      currentScore: profile.currentScore,
      highestScore: profile.highestScore,
      totalScans: profile.totalScans,
      firstScannedAt: profile.firstScannedAt,
      lastScannedAt: profile.lastScannedAt,
    },
    evolution: evolutionInfo,
  });
}

export async function POST(request: NextRequest) {
  try {
    const { username, action } = await request.json() as {
      username: string;
      action: 'reevaluate';
    };

    if (!username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    if (action !== 'reevaluate') {
      return NextResponse.json(
        { error: 'Invalid action. Supported: reevaluate' },
        { status: 400 }
      );
    }

    // Reevaluate by calling brand score API with forceReevaluate
    const origin = request.nextUrl.origin;
    const response = await fetch(`${origin}/api/x-brand-score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        forceReevaluate: true,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error || 'Reevaluation failed' },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: `Archetype reevaluated for @${username}`,
      archetype: result.brandScore.archetype,
      meta: result.meta,
    });

  } catch (error) {
    console.error('Archetype reevaluate error:', error);
    return NextResponse.json(
      { error: 'Reevaluation failed' },
      { status: 500 }
    );
  }
}
