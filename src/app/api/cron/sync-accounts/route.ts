import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { syncAccount, syncAudience } from '@/lib/tracked-accounts';

/**
 * Nightly (vercel.json): a fresh snapshot for every tracked account (brands and
 * competitors), oldest first, inside a time budget. Follower history exists
 * only from these snapshots, so this is what draws the growth line.
 *
 * Cost: ~4 SocialData requests per account (profile + up to 3 timeline pages),
 * plus ~6–18 for a brand's audience (its 6 best recent posts, re-read every 3 days).
 */
export const maxDuration = 300;
const BUDGET_MS = 270_000;
const STALE_MS = 20 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const started = Date.now();
  const accounts = await prisma.trackedAccount.findMany({
    where: {
      OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: new Date(Date.now() - STALE_MS) } }],
    },
    select: { id: true, competitorOfId: true },
    orderBy: { lastSyncedAt: { sort: 'asc', nulls: 'first' } },
  });

  let synced = 0;
  let failed = 0;
  for (const a of accounts) {
    if (Date.now() - started > BUDGET_MS) break;
    try {
      await syncAccount(a.id);
      // audience (who replies / reposts) for brands, not competitors
      if (!a.competitorOfId) await syncAudience(a.id);
      synced++;
    } catch (e) {
      failed++;
      console.error('[cron/sync-accounts]', a.id, e instanceof Error ? e.message : e);
    }
  }
  return NextResponse.json({
    accounts: accounts.length,
    synced,
    failed,
    skipped: accounts.length - synced - failed,
  });
}
