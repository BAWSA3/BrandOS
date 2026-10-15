import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { refreshAvatar } from '@/lib/avatar-refresh';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import { getHomeData, toDashboardData } from '@/lib/home-data';
import { cookies } from 'next/headers';
import { recordVisit, safeTz } from '@/lib/progress';
import { getColorway } from '@/lib/user-preferences';
import BentoDashboard from '@/components/dashboard/BentoDashboard';
import RescanOnLoad from '@/components/dashboard/RescanOnLoad';
import DashboardClient from './DashboardClient';
import FirstScan from './FirstScan';

// Auth-gated page: render per-request, never statically prerender at build.
export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ rescan?: string; design?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/signup');
  }

  if (user.accountMigrationStatus === 'legacy') {
    redirect('/migrate-account');
  }

  const workspace = await getCurrentWorkspace(user);
  const xConnections = user.platformConnections.filter((pc) => pc.platform === 'x');
  // Real-data bento once the user has a scan (the legacy tools page only shows
  // for accounts without X connected, which can't scan yet).
  // The visit awards XP / advances the streak (null if migration 029 isn't applied).
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
  const sp = await searchParams;
  const autoRescan = sp.rescan === '1' || firstScan;

  return (
    <>
      {autoRescan && <RescanOnLoad handle={home.handle} />}
      {bento && (
        <BentoDashboard
          data={bento}
          colorway={colorway}
          // ?design=v2: the 2026-10-15 redesign, previewed with real data
          design={sp.design === 'v2' ? 'v2' : 'v1'}
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
          homeHref="/home"
        />
      )}
      {firstScan ? (
        <FirstScan handle={home.handle} />
      ) : bento ? null : (
        <DashboardClient
          user={{
            id: user.id,
            name: user.name,
            email: user.email,
            xUsername: user.xUsername,
            avatar: user.avatar,
            role: user.role,
          }}
          workspace={
            workspace
              ? {
                  id: workspace.id,
                  name: workspace.name,
                  type: workspace.type,
                  plan: workspace.plan,
                  activeWorldId: workspace.activeWorldId,
                }
              : null
          }
          xConnections={xConnections.map((pc) => ({
            id: pc.id,
            username: pc.platformUsername,
            status: pc.status,
            connectedAt: pc.connectedAt.toISOString(),
          }))}
        />
      )}
    </>
  );
}
