import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import { botGuard } from '@/lib/botid-guard';
import { checkRateLimit } from '@/lib/rate-limit';
import { AccountError, syncAccount, syncAudience } from '@/lib/tracked-accounts';

/**
 * POST /api/accounts/[id]/sync — refresh one tracked account now (the nightly
 * cron covers the rest). Own workspace only; reads paid X data, so BotID and
 * at most once per account per 30 minutes.
 */
const MIN_INTERVAL_MS = 30 * 60 * 1000;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in' }, { status: 401 });
  const workspace = await getCurrentWorkspace(user);
  if (!workspace) return NextResponse.json({ error: 'No workspace' }, { status: 403 });
  if (checkRateLimit(`accounts-sync:${user.id}`, { interval: 60_000, maxRequests: 10 }).limited) {
    return NextResponse.json(
      { error: 'Too many refreshes. Try again in a minute.' },
      { status: 429 }
    );
  }

  const { id } = await params;
  const account = await prisma.trackedAccount.findFirst({
    where: { id, workspaceId: workspace.id },
  });
  if (!account) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (account.lastSyncedAt && Date.now() - account.lastSyncedAt.getTime() < MIN_INTERVAL_MS) {
    return NextResponse.json({ ok: true, fresh: true });
  }

  try {
    await syncAccount(account.id);
    if (!account.competitorOfId) await syncAudience(account.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof AccountError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[accounts] sync failed', e);
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
