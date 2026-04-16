import prisma from '@/lib/db';
import {
  getCurrentUser,
  getCurrentWorkspace,
  getActiveXAccount,
  type CurrentUser,
} from '@/lib/auth';
import { getCachedScan, countScansToday } from '@/lib/scan-cache';
import type { BrandScan, PlatformConnection, Workspace, PlanLimit } from '@prisma/client';

export type ScanGuardResult =
  | {
      allowed: true;
      user: CurrentUser;
      workspace: Workspace;
      platformConnection: PlatformConnection;
      planLimits: PlanLimit;
      cachedScan: BrandScan | null;
    }
  | {
      allowed: false;
      error: string;
      code: 'UNAUTHENTICATED' | 'NO_X_ACCOUNT' | 'DAILY_CAP' | 'NOT_MEMBER' | 'PLAN_ERROR';
      status: number;
    };

export async function assertCanScan(
  xUsername: string,
  workspaceId?: string,
): Promise<ScanGuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      allowed: false,
      error: 'Sign in to scan your brand.',
      code: 'UNAUTHENTICATED',
      status: 401,
    };
  }

  const workspace = await getCurrentWorkspace(user, workspaceId);
  if (!workspace) {
    return {
      allowed: false,
      error: workspaceId
        ? 'You are not a member of this workspace.'
        : 'No personal workspace found. Please contact support.',
      code: 'NOT_MEMBER',
      status: 403,
    };
  }

  const xAccount = await getActiveXAccount(workspace.id, xUsername);
  if (!xAccount) {
    return {
      allowed: false,
      error: `No active X account "@${xUsername}" connected to this workspace. Connect it from your dashboard first.`,
      code: 'NO_X_ACCOUNT',
      status: 403,
    };
  }

  const planLimits = await prisma.planLimit.findUnique({
    where: { plan: workspace.plan },
  });
  if (!planLimits) {
    return {
      allowed: false,
      error: 'Unable to determine plan limits. Please contact support.',
      code: 'PLAN_ERROR',
      status: 500,
    };
  }

  const cachedScan = await getCachedScan(xAccount.id);
  if (cachedScan) {
    return {
      allowed: true,
      user,
      workspace,
      platformConnection: xAccount,
      planLimits,
      cachedScan,
    };
  }

  const scansToday = await countScansToday(workspace.id);
  const dailyCap =
    workspace.type === 'team'
      ? planLimits.scansPerDay * workspace.seatCount
      : planLimits.scansPerDay;

  if (scansToday >= dailyCap) {
    return {
      allowed: false,
      error: `Daily scan limit reached (${dailyCap}/day on ${workspace.plan} plan). Upgrade for more scans.`,
      code: 'DAILY_CAP',
      status: 429,
    };
  }

  return {
    allowed: true,
    user,
    workspace,
    platformConnection: xAccount,
    planLimits,
    cachedScan: null,
  };
}
