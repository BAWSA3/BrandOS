// =============================================================================
// TEAM & AGENCY ENGINE
// Multi-user access, shared Brand DNA, approval workflows, agency mode.
// =============================================================================

import type { TeamRole, ApprovalWorkflow } from './types';

// ── Team Role Permissions ───────────────────────────────────────

export interface TeamPermissions {
  canViewBrand: boolean;
  canEditBrand: boolean;
  canCheckContent: boolean;
  canGenerateContent: boolean;
  canManageTeam: boolean;
  canApproveContent: boolean;
  canViewAnalytics: boolean;
  canConnectPlatforms: boolean;
  canDeleteBrand: boolean;
}

const ROLE_PERMISSIONS: Record<TeamRole, TeamPermissions> = {
  owner: {
    canViewBrand: true,
    canEditBrand: true,
    canCheckContent: true,
    canGenerateContent: true,
    canManageTeam: true,
    canApproveContent: true,
    canViewAnalytics: true,
    canConnectPlatforms: true,
    canDeleteBrand: true,
  },
  admin: {
    canViewBrand: true,
    canEditBrand: true,
    canCheckContent: true,
    canGenerateContent: true,
    canManageTeam: true,
    canApproveContent: true,
    canViewAnalytics: true,
    canConnectPlatforms: true,
    canDeleteBrand: false,
  },
  editor: {
    canViewBrand: true,
    canEditBrand: false,
    canCheckContent: true,
    canGenerateContent: true,
    canManageTeam: false,
    canApproveContent: false,
    canViewAnalytics: true,
    canConnectPlatforms: false,
    canDeleteBrand: false,
  },
  viewer: {
    canViewBrand: true,
    canEditBrand: false,
    canCheckContent: true,
    canGenerateContent: false,
    canManageTeam: false,
    canApproveContent: false,
    canViewAnalytics: true,
    canConnectPlatforms: false,
    canDeleteBrand: false,
  },
};

export function getPermissions(role: TeamRole): TeamPermissions {
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(
  role: TeamRole,
  permission: keyof TeamPermissions
): boolean {
  return ROLE_PERMISSIONS[role][permission];
}

// ── Approval Workflow Logic ─────────────────────────────────────

export type ApprovalAction = 'approve' | 'reject' | 'request_revision';

export interface ApprovalDecision {
  action: ApprovalAction;
  feedback?: string;
  reviewerId: string;
  decidedAt: string;
}

/**
 * Determine if content requires approval based on team settings and brand check score.
 */
export function requiresApproval(
  role: TeamRole,
  brandCheckScore?: number,
  autoApproveThreshold = 85
): boolean {
  // Owners and admins auto-approve
  if (role === 'owner' || role === 'admin') return false;

  // Editors with high brand-check scores can auto-approve
  if (role === 'editor' && brandCheckScore && brandCheckScore >= autoApproveThreshold) {
    return false;
  }

  // Everyone else needs approval
  return true;
}

/**
 * Validate an approval action against the reviewer's role.
 */
export function canReview(reviewerRole: TeamRole): boolean {
  return hasPermission(reviewerRole, 'canApproveContent');
}

/**
 * Compute approval workflow status summary for a brand/team.
 */
export function computeApprovalSummary(
  workflows: Pick<ApprovalWorkflow, 'status'>[]
): {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  revisionRequested: number;
} {
  return {
    total: workflows.length,
    pending: workflows.filter((w) => w.status === 'pending').length,
    approved: workflows.filter((w) => w.status === 'approved').length,
    rejected: workflows.filter((w) => w.status === 'rejected').length,
    revisionRequested: workflows.filter((w) => w.status === 'revision_requested').length,
  };
}

// ── Agency Mode ─────────────────────────────────────────────────

export interface AgencyBrandOverview {
  brandId: string;
  brandName: string;
  crossPlatformScore: number;
  connectedPlatforms: string[];
  lastActivity: string;
  pendingApprovals: number;
  healthTrend: 'up' | 'down' | 'stable';
}

/**
 * Agency-level overview: summarize all brands under management.
 */
export function computeAgencyOverview(
  brands: AgencyBrandOverview[]
): {
  totalBrands: number;
  avgScore: number;
  totalPendingApprovals: number;
  brandsNeedingAttention: AgencyBrandOverview[];
  healthDistribution: { healthy: number; warning: number; critical: number };
} {
  const totalBrands = brands.length;

  const avgScore = totalBrands > 0
    ? Math.round(brands.reduce((s, b) => s + b.crossPlatformScore, 0) / totalBrands)
    : 0;

  const totalPendingApprovals = brands.reduce((s, b) => s + b.pendingApprovals, 0);

  const brandsNeedingAttention = brands
    .filter((b) => b.crossPlatformScore < 60 || b.pendingApprovals > 3 || b.healthTrend === 'down')
    .sort((a, b) => a.crossPlatformScore - b.crossPlatformScore);

  const healthDistribution = {
    healthy: brands.filter((b) => b.crossPlatformScore >= 70).length,
    warning: brands.filter((b) => b.crossPlatformScore >= 40 && b.crossPlatformScore < 70).length,
    critical: brands.filter((b) => b.crossPlatformScore < 40).length,
  };

  return {
    totalBrands,
    avgScore,
    totalPendingApprovals,
    brandsNeedingAttention,
    healthDistribution,
  };
}
