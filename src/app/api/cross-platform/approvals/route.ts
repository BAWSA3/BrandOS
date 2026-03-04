import { NextRequest, NextResponse } from 'next/server';
import {
  CreateApprovalRequestSchema,
  ReviewApprovalRequestSchema,
} from '@/lib/cross-platform/schemas';
import {
  requiresApproval,
  canReview,
  computeApprovalSummary,
} from '@/lib/cross-platform/team-engine';
import { runPrePublishCheck } from '@/lib/cross-platform/pre-publish-engine';
import type { BrandDNA } from '@/lib/types';
import type { TeamRole } from '@/lib/cross-platform/types';

/**
 * POST /api/cross-platform/approvals
 * Submit content for approval or review an existing submission.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Route 1: Submit content for approval
    if (body.brandId && body.content && body.platform) {
      const parsed = CreateApprovalRequestSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const { brandId, content, platform, contentType } = parsed.data;

      // Simulate role check (in production, derive from auth session)
      const userRole: TeamRole = (body.userRole as TeamRole) ?? 'editor';

      // Run a brand check on the content
      let brandCheckScore: number | undefined;
      if (body.brandDnaJson) {
        try {
          const brandDNA: BrandDNA = JSON.parse(body.brandDnaJson);
          const check = await runPrePublishCheck(content, platform, brandDNA, {
            contentType: contentType ?? undefined,
          });
          brandCheckScore = check?.overallScore;
        } catch {
          // Non-blocking
        }
      }

      const needsApproval = requiresApproval(userRole, brandCheckScore);

      return NextResponse.json({
        approval: {
          id: `apr-${Date.now()}`,
          brandId,
          content: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
          platform,
          contentType,
          status: needsApproval ? 'pending' : 'approved',
          brandCheckScore,
          autoApproved: !needsApproval,
          submittedBy: userRole,
          createdAt: new Date().toISOString(),
        },
        message: needsApproval
          ? 'Content submitted for review. An admin or owner will approve it.'
          : 'Content auto-approved based on your role and brand check score.',
      });
    }

    // Route 2: Review an existing approval
    if (body.approvalId && body.action) {
      const parsed = ReviewApprovalRequestSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request', details: parsed.error.flatten() },
          { status: 400 }
        );
      }

      const { approvalId, action, feedback } = parsed.data;
      const reviewerRole: TeamRole = (body.reviewerRole as TeamRole) ?? 'admin';

      if (!canReview(reviewerRole)) {
        return NextResponse.json(
          { error: `Role "${reviewerRole}" does not have approval permissions.` },
          { status: 403 }
        );
      }

      const statusMap: Record<string, string> = {
        approve: 'approved',
        reject: 'rejected',
        request_revision: 'revision_requested',
      };

      return NextResponse.json({
        approval: {
          id: approvalId,
          status: statusMap[action],
          feedback,
          reviewedBy: reviewerRole,
          resolvedAt: new Date().toISOString(),
        },
        message: `Content ${statusMap[action]}${feedback ? `: ${feedback}` : ''}.`,
      });
    }

    return NextResponse.json(
      { error: 'Provide either (brandId + content + platform) to submit or (approvalId + action) to review.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Approval workflow error:', error);
    return NextResponse.json(
      { error: 'Approval workflow failed' },
      { status: 500 }
    );
  }
}
