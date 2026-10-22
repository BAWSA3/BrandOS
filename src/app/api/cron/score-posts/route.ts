import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { PAID_TIERS } from '@/lib/plans';
import { isOpenAccess } from '@/lib/billing';
import { scoreLatestPosts } from '@/lib/post-scores';

/**
 * Nightly (vercel.json): score new X posts for every trial/Pro account, so the
 * dashboard has something new waiting each morning (docs/LAUNCH-PLAN.md,
 * retention thesis). Free accounts keep the manual "Analyze new posts" button.
 *
 * Cost: one SocialData timeline read + one model call per account with new
 * posts (scoreLatestPosts caps posts per run and skips accounts with nothing
 * new). Runs sequentially inside a time budget; anything left over is caught
 * the next night or by the manual button.
 */
export const maxDuration = 300;
const BUDGET_MS = 270_000;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const started = Date.now();

  // launch window (until Dec 3): everyone has full access, so everyone is scored
  const users = await prisma.user.findMany({
    where: {
      platformConnections: { some: { platform: 'x', status: 'active' } },
      ...(isOpenAccess()
        ? {}
        : {
            OR: [
              { role: 'admin' },
              {
                subscriptionTier: { in: PAID_TIERS },
                subscriptionStatus: { in: ['ACTIVE', 'TRIALING'] },
              },
            ],
          }),
    },
    select: { id: true },
    orderBy: { updatedAt: 'desc' },
  });

  let scored = 0;
  let accounts = 0;
  let failed = 0;
  let skipped = 0;
  for (const u of users) {
    if (Date.now() - started > BUDGET_MS) {
      skipped = users.length - accounts - failed;
      break;
    }
    try {
      const r = await scoreLatestPosts(u.id);
      scored += r.scored;
      accounts++;
    } catch (e) {
      failed++;
      console.error('[cron/score-posts]', u.id, e instanceof Error ? e.message : e);
    }
  }

  return NextResponse.json({ users: users.length, accounts, scored, failed, skipped });
}
