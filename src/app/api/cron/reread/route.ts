import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { rescanOwnBrand } from '@/lib/brand-rescan';
import {
  ACTIVE_WITHIN_DAYS,
  EST_COST_PER_READ_USD,
  MAX_REREADS_PER_RUN,
  rereadDue,
} from '@/lib/auto-reread-rules';

/**
 * Nightly (vercel.json): re-read active members' brands so the score moves
 * without a manual rescan, and "why my score moved" has a fresh pair of reads
 * (docs/strategy/PRODUCT-MAP.md §4.2).
 *
 * Who: a dashboard visit in the last 7 days and a latest read (manual or
 * automatic) at least 3 days old — src/lib/auto-reread-rules.ts. Oldest read
 * first, at most MAX_REREADS_PER_RUN a night, inside a time budget.
 * The read itself is rescanOwnBrand: the member's own X connection only, the
 * scorer's 6h cache, RESCANS_PER_DAY, Pro (everyone until Dec 3), Claude
 * when GEMINI_DISABLED. No emails.
 *
 * Cost: logged per run as reads × EST_COST_PER_READ_USD (an estimate).
 * `?limit=n` (with the cron secret) caps a manual run, e.g. to measure one read.
 */
export const maxDuration = 300;
const BUDGET_MS = 270_000;
const DAY_MS = 86_400_000;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const started = Date.now();
  const now = new Date();
  const limitParam = Number(request.nextUrl.searchParams.get('limit'));
  const limit =
    Number.isInteger(limitParam) && limitParam > 0
      ? Math.min(limitParam, MAX_REREADS_PER_RUN)
      : MAX_REREADS_PER_RUN;

  // Active members (visits are recorded by the dashboard, src/lib/progress.ts)
  const active = await prisma.userProgress.findMany({
    where: { lastVisitAt: { gt: new Date(now.getTime() - ACTIVE_WITHIN_DAYS * DAY_MS) } },
    select: { userId: true, lastVisitAt: true },
  });
  const due: { userId: string; lastReadAt: Date | null }[] = [];
  for (const a of active) {
    const [read, x] = await Promise.all([
      prisma.brandScan.findFirst({
        where: { userId: a.userId },
        orderBy: { scannedAt: 'desc' },
        select: { scannedAt: true },
      }),
      prisma.platformConnection.count({
        where: { userId: a.userId, platform: 'x', status: 'active' },
      }),
    ]);
    const m = { lastVisitAt: a.lastVisitAt, lastReadAt: read?.scannedAt ?? null, hasX: x > 0 };
    if (rereadDue(m, now)) due.push({ userId: a.userId, lastReadAt: m.lastReadAt });
  }
  // oldest read first, so nobody waits more than a night or two
  due.sort((a, b) => (a.lastReadAt?.getTime() ?? 0) - (b.lastReadAt?.getTime() ?? 0));

  let read = 0;
  let unchanged = 0;
  let failed = 0;
  let skipped = 0;
  for (const d of due.slice(0, limit)) {
    if (Date.now() - started > BUDGET_MS) break;
    try {
      const user = await prisma.user.findUnique({
        where: { id: d.userId },
        include: {
          workspaceMemberships: { include: { workspace: true } },
          ownedWorkspaces: true,
          platformConnections: { where: { status: 'active' } },
        },
      });
      if (!user) {
        skipped++;
        continue;
      }
      const workspace = user.ownedWorkspaces.find((w) => w.type === 'personal') ?? null;
      const r = await rescanOwnBrand(user, workspace, request.nextUrl.origin);
      if (r.ok && r.saved) read++;
      else if (r.ok) unchanged++;
      else {
        skipped++;
        console.warn('[cron/reread] skipped', d.userId, r.status, r.error);
      }
    } catch (e) {
      failed++;
      console.error('[cron/reread]', d.userId, e instanceof Error ? e.message : e);
    }
  }

  const summary = {
    active: active.length,
    due: due.length,
    read,
    unchanged,
    skipped,
    failed,
    left: Math.max(0, due.length - limit),
    estCostUsd: Math.round((read + unchanged) * EST_COST_PER_READ_USD * 1000) / 1000,
    ms: Date.now() - started,
  };
  console.log('[cron/reread]', JSON.stringify(summary));
  return NextResponse.json(summary);
}
