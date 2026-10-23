import { after } from 'next/server';
import prisma from '@/lib/db';
import type { CurrentUser } from '@/lib/auth';
import { hasPro } from '@/lib/billing';
import { computeBrandScore } from '@/lib/brand-score';
import { saveAvatar } from '@/lib/avatar-refresh';
import { extractIntelligence } from '@/lib/scan-tracking';
import { normalizeArchetypeName } from '@/lib/archetype-names';
import { scoreLatestPosts } from '@/lib/post-scores';
import { refreshEntryFromRead } from '@/lib/creator-index';

/**
 * Rescan the signed-in user's OWN brand (their active X connection) and save
 * it to their account (BrandScan). Shared by POST /api/dashboard/rescan and
 * the Creator Index join, which refreshes a stale read after responding.
 *
 * Callers do auth and BotID. This applies the cost rules: free accounts get
 * their first scan only (rescans are Pro), at most RESCANS_PER_DAY saved
 * scans per user per day, and the scorer's 6h cache (a rescan inside that
 * window returns the same result and saves no duplicate row).
 */

export const RESCANS_PER_DAY = 5;
const DAY_MS = 86_400_000;

export type RescanResult =
  | { ok: true; saved: boolean; cached: boolean; score: number; quick: boolean }
  | { ok: false; status: number; error: string; pro?: true };

export async function rescanOwnBrand(
  user: CurrentUser,
  workspace: { id: string } | null,
  origin: string
): Promise<RescanResult> {
  // Free accounts get their first scan; rescans are Pro (trial included).
  if (!hasPro(user) && (await prisma.brandScan.count({ where: { userId: user.id } })) > 0) {
    return { ok: false, status: 402, error: 'Pro required', pro: true };
  }
  const x = user.platformConnections.find((pc) => pc.platform === 'x');
  if (!workspace || !x) {
    return { ok: false, status: 400, error: 'Connect your X account to rescan' };
  }
  const handle = x.platformUsername.replace(/^@/, '');

  const today = await prisma.brandScan.count({
    where: { userId: user.id, scannedAt: { gt: new Date(Date.now() - DAY_MS) } },
  });
  if (today >= RESCANS_PER_DAY) {
    return {
      ok: false,
      status: 429,
      error: `That's ${RESCANS_PER_DAY} scans today. Come back tomorrow.`,
    };
  }

  const result = await computeBrandScore(handle, origin);
  if (result.status !== 200) {
    return {
      ok: false,
      status: result.status === 404 ? 404 : 502,
      error: result.status === 404 ? 'Could not read your X profile' : 'Scan failed',
    };
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
  if (!bs || score === null) return { ok: false, status: 502, error: 'Scan failed' };

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
      select: { score: true },
    });
    if (existing)
      return { ok: true, saved: false, cached: true, score: existing.score, quick: false };
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
    select: { score: true },
  });
  // a Creator Index member's card shows their latest read
  await refreshEntryFromRead(user.id, scan.score, archetype);

  // Fresh scan, fresh read on recent posts: score any new ones after the
  // response (best-effort; the dashboard shows them on the next load).
  after(() =>
    scoreLatestPosts(user.id).catch((e) => console.error('[rescan] post scoring failed:', e))
  );

  return {
    ok: true,
    saved: true,
    cached: !!body.meta?.cached,
    score: scan.score,
    quick: !!bs._fallback,
  };
}
