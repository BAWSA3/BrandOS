import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import { resolveWorld, resolveCustomWorld } from '@/worlds';
import type { WorldManifest } from '@/worlds/types';
import prisma from '@/lib/db';
import { WorldProvider } from '@/components/world/WorldProvider';
import WorldScene from '@/components/world/WorldScene';
import MuteButton from '@/components/world/MuteButton';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/signup');
  if (user.accountMigrationStatus === 'legacy') redirect('/migrate-account');

  const workspace = await getCurrentWorkspace(user);
  const world = await resolveWorldForWorkspace(workspace);

  return (
    <WorldProvider world={world}>
      <div className="relative min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--text-primary)' }}>
        <WorldScene intensity={0.9} />
        <div className="relative z-10">{children}</div>
        <MuteButton />
      </div>
    </WorldProvider>
  );
}

async function resolveWorldForWorkspace(
  workspace: { id: string; activeWorldId: string | null; customWorldId: string | null } | null,
): Promise<WorldManifest> {
  if (!workspace) return resolveWorld(null);

  if (workspace.customWorldId) {
    try {
      const custom = await prisma.customWorld.findUnique({
        where: { id: workspace.customWorldId },
      });
      if (custom) {
        const base = resolveWorld(custom.baseWorldId);
        return resolveCustomWorld(base, (custom.manifest as Record<string, unknown>) ?? {});
      }
    } catch (error) {
      console.error('[Worlds] Failed to load custom world:', error);
    }
  }

  return resolveWorld(workspace.activeWorldId);
}
