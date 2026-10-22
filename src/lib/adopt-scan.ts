import prisma from '@/lib/db';
import { publicRead } from '@/lib/mcp/profile-read';
import { normalizeArchetypeName } from '@/lib/archetype-names';
import { getCurrentWorkspace } from '@/lib/auth';

/**
 * "Your scan comes with you": a new account's first dashboard visit reuses the
 * homepage scan they just ran for their own handle (public, under 7 days old)
 * instead of scanning again. No AI or X calls, no wait. Returns true if a scan
 * was saved to the account.
 */
export async function adoptPublicScan(
  user: Parameters<typeof getCurrentWorkspace>[0] & { id: string },
  x: { id: string; platformUsername: string }
): Promise<boolean> {
  try {
    if ((await prisma.brandScan.count({ where: { userId: user.id } })) > 0) return false;
    const handle = x.platformUsername.replace(/^@/, '');
    const read = await publicRead(handle);
    if (!read) return false;
    const workspace = await getCurrentWorkspace(user);
    if (!workspace) return false;
    const i = read.intel;
    await prisma.brandScan.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        platformConnectionId: x.id,
        xUsername: handle.toLowerCase(),
        score: read.score,
        archetype: normalizeArchetypeName(read.archetype || '') || 'unknown',
        phaseScores: i.phaseScores ?? {},
        strengths: i.strengths ?? [],
        improvements: i.improvements ?? [],
        insights: i.insights ?? undefined,
        summary: i.summary ?? null,
        influenceTier: i.influenceTier ?? null,
        nextMoves: i.nextMoves ?? undefined,
        contentPillars: i.contentPillars ?? undefined,
        scannedAt: read.scannedAt ?? new Date(),
      },
    });
    return true;
  } catch (e) {
    console.error('[adopt-scan] failed', e);
    return false;
  }
}
