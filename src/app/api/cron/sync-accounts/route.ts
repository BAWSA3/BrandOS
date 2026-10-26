import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { COMPETITORS_PER_BRAND, syncAccount, syncAudience } from '@/lib/tracked-accounts';
import { getGrowthView } from '@/lib/growth-data';
import { refreshBrandIdeas } from '@/lib/brand-ideas';

/**
 * Nightly (vercel.json): a fresh snapshot for every tracked account (brands and
 * competitors), oldest first, inside a time budget. Follower history exists
 * only from these snapshots, so this is what draws the growth line.
 *
 * Cost: ~4 SocialData requests per account (profile + up to 3 timeline pages),
 * plus ~6–18 for a brand's audience (its 6 best recent posts, re-read every 3 days)
 * and, for brands, one model call when its board has fewer than 3 BrandOS ideas waiting.
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
    select: { id: true, competitorOfId: true, workspaceId: true, addedByUserId: true },
    orderBy: { lastSyncedAt: { sort: 'asc', nulls: 'first' } },
  });

  let synced = 0;
  let failed = 0;
  let ideas = 0;
  for (const a of accounts) {
    if (Date.now() - started > BUDGET_MS) break;
    try {
      await syncAccount(a.id);
      // audience (who replies / reposts) for brands, not competitors
      if (!a.competitorOfId) {
        await syncAudience(a.id);
        // a fresh BrandOS idea board each morning (tops up to 3 waiting ideas)
        if (a.addedByUserId) {
          const view = await getGrowthView(a.workspaceId, a.id, {
            brands: 1,
            competitors: COMPETITORS_PER_BRAND,
          });
          if (view) ideas += await refreshBrandIdeas(view, a.addedByUserId).catch(() => 0);
        }
      }
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
    ideas,
    skipped: accounts.length - synced - failed,
  });
}
