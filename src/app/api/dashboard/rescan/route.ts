import { NextRequest, NextResponse, after } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import { botGuard } from '@/lib/botid-guard';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { computeBrandScore } from '@/lib/brand-score';
import { saveAvatar } from '@/lib/avatar-refresh';
import { extractIntelligence } from '@/lib/scan-tracking';
import { normalizeArchetypeName } from '@/lib/archetype-names';
import { scoreLatestPosts } from '@/lib/post-scores';

/**
 * POST /api/dashboard/rescan — the signed-in user rescans their own brand from
 * the dashboard, and the result is saved to their account (BrandScan), which
 * is what the dashboard's score, history, phases and XP read.
 *
 * Security:
 * - Auth required; scans ONLY the user's own active X connection (no handle
 *   is accepted from the request).
 * - AI cost surface: BotID + 5/min per IP + at most RESCANS_PER_DAY saved
 *   scans per user per day.
 * - The scorer's 6h cache applies: a rescan inside that window returns the
 *   same result and does not save a duplicate row.
 */

const RESCANS_PER_DAY = 5;
const DAY_MS = 86_400_000;

async function handlePost(request: NextRequest) {
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in to rescan' }, { status: 401 });

  const workspace = await getCurrentWorkspace(user);
  const x = user.platformConnections.find((pc) => pc.platform === 'x');
  if (!workspace || !x) {
    return NextResponse.json({ error: 'Connect your X account to rescan' }, { status: 400 });
  }
  const handle = x.platformUsername.replace(/^@/, '');

  try {
    const today = await prisma.brandScan.count({
      where: { userId: user.id, scannedAt: { gt: new Date(Date.now() - DAY_MS) } },
    });
    if (today >= RESCANS_PER_DAY) {
      return NextResponse.json(
        { error: `That's ${RESCANS_PER_DAY} scans today. Come back tomorrow.` },
        { status: 429 }
      );
    }

    const result = await computeBrandScore(handle, request.nextUrl.origin);
    if (result.status !== 200) {
      return NextResponse.json(
        { error: result.status === 404 ? 'Could not read your X profile' : 'Scan failed' },
        { status: result.status === 404 ? 404 : 502 }
      );
    }

    const body = result.body as {
      brandScore?: Record<string, unknown> & {
        overallScore?: number;
        archetype?: { primary?: string };
        _fallback?: boolean;
      };
      meta?: { cached?: boolean; analyzedAt?: string };
    };
    const bs = body.brandScore;
    const score = typeof bs?.overallScore === 'number' ? Math.round(bs.overallScore) : null;
    if (!bs || score === null) {
      return NextResponse.json({ error: 'Scan failed' }, { status: 502 });
    }

    // the scan just read their X profile: keep the stored photo current
    await saveAvatar(
      user.id,
      (result.body.profile as { profile_image_url?: string } | undefined)?.profile_image_url
    );

    // Inside the scorer's cache window the result is unchanged: don't save a
    // duplicate if this user already has a scan from that analysis.
    const analyzedAt = body.meta?.analyzedAt ? new Date(body.meta.analyzedAt) : null;
    if (body.meta?.cached && analyzedAt) {
      const existing = await prisma.brandScan.findFirst({
        where: { userId: user.id, scannedAt: { gte: analyzedAt } },
        orderBy: { scannedAt: 'desc' },
        select: { id: true, score: true },
      });
      if (existing) {
        return NextResponse.json({ saved: false, cached: true, score: existing.score });
      }
    }

    const intel = bs._fallback ? null : extractIntelligence(bs);
    const archetype = normalizeArchetypeName(bs.archetype?.primary || '') || 'unknown';
    const scan = await prisma.brandScan.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        platformConnectionId: x.id,
        xUsername: handle.toLowerCase(),
        score,
        archetype,
        phaseScores: intel?.phaseScores ?? {},
        strengths: intel?.strengths ?? [],
        improvements: intel?.improvements ?? [],
        insights: intel?.insights ?? undefined,
        summary: intel?.summary ?? null,
        influenceTier: intel?.influenceTier ?? null,
        nextMoves: intel?.nextMoves ?? undefined,
        contentPillars: intel?.contentPillars ?? undefined,
      },
      select: { id: true, score: true },
    });

    // Fresh scan, fresh read on recent posts: score any new ones after the
    // response (best-effort; the dashboard shows them on the next load).
    after(() =>
      scoreLatestPosts(user.id).catch((e) =>
        console.error('[dashboard/rescan] post scoring failed:', e)
      )
    );

    return NextResponse.json({
      saved: true,
      cached: !!body.meta?.cached,
      score: scan.score,
      quick: !!bs._fallback,
    });
  } catch (error) {
    console.error('[dashboard/rescan] failed:', error);
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePost, rateLimiters.aiStrict);
