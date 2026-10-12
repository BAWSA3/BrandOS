import { redirect } from 'next/navigation';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import { getHomeData, toDashboardData } from '@/lib/home-data';
import { recordVisit } from '@/lib/progress';
import BentoDashboard from '@/components/dashboard/BentoDashboard';
import RescanOnLoad from '@/components/dashboard/RescanOnLoad';
import DashboardClient from './DashboardClient';

// Auth-gated page: render per-request, never statically prerender at build.
export const dynamic = 'force-dynamic';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ rescan?: string }>;
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
  // Real-data bento on top once the user has a scan; the existing tools stay below.
  // The visit awards XP / advances the streak (null if migration 029 isn't applied).
  const home = await getHomeData(user);
  const progress = await recordVisit(user.id, home.scans);
  const bento = toDashboardData(home);
  if (bento && progress && progress.streakDays > 1) bento.ticker.streak = `${progress.streakDays}d`;

  // "Rescan" on the main menu (/home) lands here with ?rescan=1
  const autoRescan = (await searchParams).rescan === '1';

  return (
    <>
      {autoRescan && <RescanOnLoad handle={home.handle} />}
      {bento && (
        <BentoDashboard
          data={bento}
          xp={progress ? { total: progress.xpTotal, gains: progress.gains } : null}
          scoreAlert={progress?.scoreAlert ?? null}
          rescan="live"
          homeHref="/home"
        />
      )}
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
    </>
  );
}
