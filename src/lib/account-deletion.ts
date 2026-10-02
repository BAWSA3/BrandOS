// ============================================================================
// account-deletion — hard-delete a user and their personal data
//
// Implements the locked account-deletion decisions (docs/SECURITY-HARDENING.md):
//   - Personal scans: hard-delete
//   - Team workspaces OWNED by the user: cascade-delete, but only with the
//     caller's explicit consent (the route returns 409 until consent is given;
//     ownership transfer is a future UI flow)
//   - Workspaces where the user is just a member: drop the membership, leave
//     the workspace and its scans intact
//   - SecurityAuditLog rows: kept (user_id SET NULL) — retention cron purges
//
// Deletion order matters: BrandScan.user, Workspace.owner,
// AuditReportShare.createdBy and ApprovalRequest.submittedBy are RESTRICT
// relations, so they must be cleared before the User row can be deleted.
// Everything else cascades from the User delete.
//
// NOTE: the legacy anonymous `BrandScans` table has no user link (pre-Phase-1
// scans were never joined to accounts — see the reclaim-flow decision), so
// there is nothing user-owned to delete there.
// ============================================================================

import prisma from '@/lib/db';

export interface DeletionCounts {
  brandScans: number;
  platformConnections: number;
  ownedWorkspaces: number;
  memberships: number;
  shares: number;
}

/**
 * Deletes all app data for a user inside a single transaction.
 * Does NOT touch the Supabase auth user or Stripe — callers handle those.
 * Throws if the user still owns team workspaces and consent wasn't given.
 */
export async function deleteAccountData(
  userId: string,
  opts: { deleteOwnedTeamWorkspaces?: boolean } = {},
): Promise<DeletionCounts> {
  const ownedWorkspaces = await prisma.workspace.findMany({
    where: { ownerUserId: userId },
    select: { id: true, name: true, type: true },
  });

  const ownedTeamWorkspaces = ownedWorkspaces.filter((w) => w.type === 'team');
  if (ownedTeamWorkspaces.length > 0 && !opts.deleteOwnedTeamWorkspaces) {
    throw new OwnedTeamWorkspacesError(ownedTeamWorkspaces);
  }

  const ownedIds = ownedWorkspaces.map((w) => w.id);

  const [shares, scans, , connections, , memberships, , workspaces] =
    await prisma.$transaction([
      // RESTRICT relations first — in an order that never leaves a dangling FK
      prisma.auditReportShare.deleteMany({
        where: { OR: [{ createdByUserId: userId }, { workspaceId: { in: ownedIds } }] },
      }),
      prisma.brandScan.deleteMany({
        where: { OR: [{ userId }, { workspaceId: { in: ownedIds } }] },
      }),
      prisma.approvalRequest.deleteMany({ where: { submittedById: userId } }),
      // BrandScan -> PlatformConnection is RESTRICT: connections only after scans
      prisma.platformConnection.deleteMany({
        where: { OR: [{ userId }, { workspaceId: { in: ownedIds } }] },
      }),
      prisma.dailyBrief.deleteMany({
        where: { OR: [{ userId }, { workspaceId: { in: ownedIds } }] },
      }),
      prisma.workspaceMember.deleteMany({
        where: { OR: [{ userId }, { workspaceId: { in: ownedIds } }] },
      }),
      // CustomWorld has no FK back to Workspace — explicit cleanup
      prisma.customWorld.deleteMany({ where: { workspaceId: { in: ownedIds } } }),
      prisma.workspace.deleteMany({ where: { id: { in: ownedIds } } }),
      // Remaining relations (brands, purchases, sessions, ...) cascade from here
      prisma.user.delete({ where: { id: userId } }),
    ]);

  return {
    brandScans: scans.count,
    platformConnections: connections.count,
    ownedWorkspaces: workspaces.count,
    memberships: memberships.count,
    shares: shares.count,
  };
}

export class OwnedTeamWorkspacesError extends Error {
  constructor(
    public readonly workspaces: Array<{ id: string; name: string }>,
  ) {
    super('User owns team workspaces; explicit consent required to delete them');
    this.name = 'OwnedTeamWorkspacesError';
  }
}
