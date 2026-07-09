import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import prisma from '@/lib/db';

/**
 * GET /api/scan-history?username=xxx
 *
 * Returns the authenticated user's workspace scan history from the Phase 1
 * BrandScan table. Optional ?username narrows to one connected handle —
 * always scoped to the caller's workspace, so no cross-user reads.
 *
 * (Previously read the legacy public BrandScans table by arbitrary username —
 * wrong table for Phase 1 scans and an unscoped cross-handle read.)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const workspace = await getCurrentWorkspace(user);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    const scans = await prisma.brandScan.findMany({
      where: {
        workspaceId: workspace.id,
        ...(username ? { xUsername: username.toLowerCase() } : {}),
      },
      select: {
        score: true,
        archetype: true,
        phaseScores: true,
        scannedAt: true,
        xUsername: true,
      },
      orderBy: { scannedAt: 'asc' },
      take: 100,
    });

    if (scans.length === 0) {
      return NextResponse.json({
        username: username ?? user.xUsername ?? null,
        scans: [],
        stats: null,
        deltas: null,
      });
    }

    const parsed = scans.map((s) => ({
      score: s.score,
      archetype: s.archetype,
      phaseScores: (s.phaseScores ?? null) as {
        define?: number;
        check?: number;
        generate?: number;
        scale?: number;
      } | null,
      createdAt: s.scannedAt.toISOString(),
    }));

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
      username: username ?? scans[scans.length - 1].xUsername,
      scans: parsed,
      stats,
      deltas,
    });
  } catch (error) {
    console.error('[ScanHistory] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
