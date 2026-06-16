import { redirect } from 'next/navigation';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import DashboardClient from './DashboardClient';

// Auth-gated page: render per-request, never statically prerender at build.
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/signup');
  }

  if (user.accountMigrationStatus === 'legacy') {
    redirect('/migrate-account');
  }

  const workspace = await getCurrentWorkspace(user);
  const xConnections = user.platformConnections.filter((pc) => pc.platform === 'x');

  return (
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
  );
}
