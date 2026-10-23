import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { refreshAvatar } from '@/lib/avatar-refresh';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import { getHomeData, toDashboardData } from '@/lib/home-data';
import { cookies } from 'next/headers';
import { recordVisit, safeTz } from '@/lib/progress';
import { getColorway } from '@/lib/user-preferences';
import { hasPro, isOpenAccess, isSubscribed, trialEndsAt } from '@/lib/billing';
import { OPEN_ACCESS_UNTIL } from '@/lib/plans';
import type { PlanBadge } from '@/components/billing/PlanChip';
import { syncSubscription } from '@/lib/billing-sync';
import { foundingNumber, foundingSpotsLeft } from '@/lib/founding';
import { stripe } from '@/lib/stripe';
import Paywall from '@/components/billing/Paywall';
import { lookupStats } from '@/lib/lookups';
import BentoDashboard from '@/components/dashboard/BentoDashboard';
import RescanOnLoad from '@/components/dashboard/RescanOnLoad';
import ConnectX from './ConnectX';
import BackupLoginNudge from '@/components/dashboard/BackupLoginNudge';
import { adoptPublicScan } from '@/lib/adopt-scan';
import FirstScan from './FirstScan';
import prisma from '@/lib/db';
import { addAccount, brandLimit, COMPETITORS_PER_BRAND } from '@/lib/tracked-accounts';
import { getGrowthView, type GrowthView } from '@/lib/growth-data';
import GrowthDashboard from '@/components/growth/GrowthDashboard';

// Auth-gated page: render per-request, never statically prerender at build.
export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ rescan?: string; design?: string; checkout?: string; brand?: string }>;
}) {
  const sp = await searchParams;
  let user = await getCurrentUser();

  // Back from Stripe Checkout: sync the new subscription now so the trial
  // unlocks immediately (the webhook may land a few seconds later; both are
  // idempotent). Only the signed-in buyer's own session is honoured.
  // (isSubscribed, not hasPro: open access makes everyone Pro until Dec 3)
  if (user && sp.checkout && !isSubscribed(user) && process.env.STRIPE_SECRET_KEY) {
    try {
      const session = await stripe.checkout.sessions.retrieve(sp.checkout.slice(0, 200), {
        expand: ['subscription'],
      });
      const sub = session.subscription;
      if (session.metadata?.userId === user.id && sub && typeof sub !== 'string') {
        await syncSubscription(sub);
        user = await getCurrentUser();
      }
    } catch (e) {
      console.error('[dashboard] checkout return sync failed', e);
    }
  }

  if (!user) {
    redirect('/signup');
  }

  // Old X-only accounts get an optional nudge (below), never a wall.
  const legacy = user.accountMigrationStatus === 'legacy';

  const xConnections = user.platformConnections.filter((pc) => pc.platform === 'x');

  // Growth dashboard (pivot 2026-10-22) for anyone with Pro access (everyone
  // until Dec 3). ?design=v2 keeps the old dashboard reachable while the new
  // one beds in; before migration 040 is applied this falls through to it.
  if (sp.design !== 'v2' && hasPro(user)) {
    const view = await loadGrowth(user, xConnections[0]?.platformUsername, sp.brand);
    if (view) return <GrowthDashboard view={view} />;
  }
  // Real-data bento once the user has a scan (the legacy tools page only shows
  // for accounts without X connected, which can't scan yet).
  // The visit awards XP / advances the streak (null if migration 029 isn't applied).
  // "Your scan comes with you": a homepage scan of their own handle becomes
  // the account's first scan (no second scan, no wait).
  if (xConnections[0]) await adoptPublicScan(user, xConnections[0]);
  const home = await getHomeData(user);
  // first visit of the day: check X for a new profile photo (background)
  after(() => refreshAvatar(user.id).catch(() => null));
  // days + streaks follow the user's own midnight (timezone cookie set by the dashboard)
  const tz = safeTz((await cookies()).get('bos_tz')?.value);
  const [progress, colorway] = await Promise.all([
    recordVisit(user.id, home.scans, new Date(), home.posts, tz),
    getColorway(user.id),
  ]);
  const bento = toDashboardData(home);
  if (bento && progress && progress.streakDays > 1) bento.ticker.streak = `${progress.streakDays}d`;

  // "Rescan" on the main menu (/home) lands here with ?rescan=1. A signed-in
  // account with X connected but no scan yet gets its first scan the same way,
  // so the real dashboard (not the legacy tools) is what they land on.
  const firstScan = !bento && xConnections.length > 0;
  // Pro (trial included) gets the dashboard; free accounts see it locked.
  const pro = hasPro(user);
  const autoRescan = (sp.rescan === '1' && pro) || firstScan;
  const subscribed = isSubscribed(user);
  const foundingLeft = !subscribed && bento ? await foundingSpotsLeft() : 0;
  const trialEnd = trialEndsAt(user);
  // Top-bar plan badge: the launch offer (lock $29), a founding card, or a trial
  let plan: PlanBadge | null = null;
  if (!subscribed && isOpenAccess()) {
    plan = { kind: 'open', until: OPEN_ACCESS_UNTIL.toISOString(), spotsLeft: foundingLeft };
  } else if (trialEnd) {
    const number = await foundingNumber(user.id);
    plan =
      number !== null
        ? { kind: 'founding', number, chargesAt: trialEnd.toISOString() }
        : { kind: 'trial', endsAt: trialEnd.toISOString() };
  }
  // "your brand was looked up": last 7 days + last 24h (counts only)
  const now = Date.now();
  const [lookWeek, lookDay] = bento
    ? await Promise.all([
        lookupStats(bento.handle, new Date(now - 7 * 86_400_000)),
        lookupStats(bento.handle, new Date(now - 86_400_000)),
      ])
    : [null, null];

  return (
    <>
      {autoRescan && <RescanOnLoad handle={home.handle} />}
      {bento && (
        <BentoDashboard
          data={bento}
          colorway={colorway}
          // v2 is the launch default (decided 2026-10-18); ?design=v1 for the old layout
          design={sp.design === 'v1' ? 'v1' : 'v2'}
          plan={plan}
          lookups={lookWeek && lookDay ? { week: lookWeek, today: lookDay.total } : null}
          xp={
            progress
              ? {
                  total: progress.xpTotal,
                  gains: progress.gains,
                  today: progress.today,
                  day: progress.day,
                  streakDays: progress.streakDays,
                }
              : null
          }
          scoreAlert={progress?.scoreAlert ?? null}
          rescan="live"
          homeHref="/dashboard"
        />
      )}
      {bento && !pro && (
        <Paywall handle={bento.handle} score={bento.ticker.score} foundingLeft={foundingLeft} />
      )}
      {firstScan ? (
        <FirstScan handle={home.handle} />
      ) : bento ? null : (
        // Signed up with Google / email: one step left
        <ConnectX name={user.name} />
      )}
      {legacy && bento && <BackupLoginNudge />}
    </>
  );
}

/**
 * The growth view for the user's workspace. First visit: the user's own X
 * account becomes their first brand (one sync, a few seconds). Null when the
 * tables aren't there yet (migration 040) or there's nothing to show.
 */
async function loadGrowth(
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>,
  ownHandle: string | undefined,
  brandId: string | undefined
): Promise<GrowthView | null> {
  try {
    const workspace = await getCurrentWorkspace(user);
    if (!workspace) return null;
    const limits = { brands: brandLimit(user), competitors: COMPETITORS_PER_BRAND };
    const count = await prisma.trackedAccount.count({
      where: { workspaceId: workspace.id, competitorOfId: null },
    });
    if (count === 0 && ownHandle) {
      await addAccount({
        workspaceId: workspace.id,
        userId: user.id,
        limit: limits.brands,
        rawHandle: ownHandle,
        kind: 'creator',
      });
    }
    return await getGrowthView(workspace.id, brandId, limits);
  } catch (e) {
    console.error('[dashboard] growth view unavailable, using the classic dashboard', e);
    return null;
  }
}
