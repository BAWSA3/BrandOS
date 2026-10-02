import { getCurrentUser, getCurrentWorkspace, ensurePersonalWorkspace } from '@/lib/auth';

// Shared auth context for workspace-scoped API routes (brands, history, and
// the ports that follow). One home for the personal-workspace-fallback
// policy so workspace switching lands in exactly one place later.

/**
 * Resolve the caller and their workspace.
 * `ensure: false` keeps the call read-only — GET handlers must not create
 * workspaces as a side effect (concurrent first-load GETs would race
 * ensurePersonalWorkspace's find-then-create and can double-create).
 */
export async function getWorkspaceContext(opts: { ensure: boolean }) {
  const user = await getCurrentUser();
  if (!user) return null;

  const workspace = opts.ensure
    ? ((await getCurrentWorkspace(user)) ??
      (await ensurePersonalWorkspace(user.id, user.name ?? undefined)))
    : await getCurrentWorkspace(user);

  return { user, workspace };
}

/**
 * Ownership scope for a single brand: the caller's workspace, with a
 * fallback for legacy rows they own that haven't been adopted into a
 * workspace yet (see /api/brands adopt-on-read).
 */
export function ownedBrandWhere(id: string, workspaceId: string | null, userId: string) {
  return { id, ...ownedBrandsWhere(workspaceId, userId) };
}

/**
 * Same scope without the id — for findMany over all accessible brands.
 * A null workspace (authenticated user whose personal workspace hasn't been
 * created yet) still owns their legacy rows — never emit `workspaceId: null`
 * alone, which would match every unadopted brand in the table.
 */
export function ownedBrandsWhere(workspaceId: string | null, userId: string) {
  return workspaceId
    ? { OR: [{ workspaceId }, { userId, workspaceId: null }] }
    : { userId, workspaceId: null };
}
