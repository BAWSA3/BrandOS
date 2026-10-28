import prisma from '@/lib/db';
import { levelFor } from '@/lib/xp';
import type { StandingMini } from '@/components/dashboard-v2/Shell';

/** Standing for the v2 rail: level, progress into it, the visit run (null before mig 029). */
export async function loadStanding(userId: string): Promise<StandingMini | null> {
  try {
    const p = await prisma.userProgress.findUnique({
      where: { userId },
      select: { xpTotal: true, currentStreakDays: true },
    });
    if (!p) return null;
    const l = levelFor(p.xpTotal);
    return { level: l.level, progress: l.need > 0 ? l.into / l.need : 0, run: p.currentStreakDays };
  } catch {
    return null;
  }
}

/** The workspace's own brands (not competitors) for ⌘K, oldest first; [] before mig 040. */
export async function loadBrands(
  workspaceId: string
): Promise<{ id: string; handle: string; kind: string }[]> {
  try {
    const rows = await prisma.trackedAccount.findMany({
      where: { workspaceId, competitorOfId: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true, displayHandle: true, kind: true },
      take: 50,
    });
    return rows.map((r) => ({ id: r.id, handle: r.displayHandle, kind: r.kind }));
  } catch {
    return [];
  }
}

/** Article mode's idea picker: open ideas on the brand's board (text only, capped). */
export async function loadOpenIdeas(accountId: string): Promise<{ id: string; text: string }[]> {
  try {
    const rows = await prisma.idea.findMany({
      where: { accountId, status: { in: ['saved', 'drafting'] } },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { id: true, suggestion: true },
    });
    return rows.map((r) => ({ id: r.id, text: r.suggestion.slice(0, 300) }));
  } catch {
    return [];
  }
}

/** Article mode's idea picker: the brand's most-liked posts of the last 60 days. */
export async function loadTopPosts(accountId: string): Promise<{ text: string; note: string }[]> {
  try {
    const rows = await prisma.accountPost.findMany({
      where: { accountId, postedAt: { gte: new Date(Date.now() - 60 * 86_400_000) } },
      orderBy: { likes: 'desc' },
      take: 3,
      select: { text: true, likes: true },
    });
    return rows.map((p) => ({
      text: p.text.slice(0, 280),
      note: `A top post / ${p.likes.toLocaleString('en-US')} likes`,
    }));
  } catch {
    return [];
  }
}
