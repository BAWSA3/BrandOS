import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import { encryptOauthToken, getCurrentKeyId } from '@/lib/crypto';
import { logSecurityEvent, getClientIp } from '@/lib/audit-log';
import { computeXAccountCap } from '@/lib/plans';

/**
 * POST /api/connect-x
 *
 * Connects an X account to the authenticated user's workspace.
 * Called after the X OAuth flow completes on the client side
 * (via supabase.auth.linkIdentity or a custom OAuth exchange).
 *
 * Body: { xUsername, xUserId, accessToken, refreshToken?, workspaceId? }
 *
 * Phase 1: This route handles the server-side storage of verified
 * X credentials. The client-side OAuth initiation is handled by
 * the dashboard's ConnectXButton component.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { xUsername, xUserId, accessToken, refreshToken, workspaceId } = body as {
      xUsername: string;
      xUserId: string;
      accessToken: string;
      refreshToken?: string;
      workspaceId?: string;
    };

    if (!xUsername || !xUserId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required fields: xUsername, xUserId, accessToken' },
        { status: 400 },
      );
    }

    const workspace = await getCurrentWorkspace(user, workspaceId);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check X account cap for this workspace
    const planLimits = await prisma.planLimit.findUnique({
      where: { plan: workspace.plan },
    });
    if (!planLimits) {
      return NextResponse.json({ error: 'Plan limits not found' }, { status: 500 });
    }

    const currentConnections = await prisma.platformConnection.count({
      where: { workspaceId: workspace.id, platform: 'x', status: 'active' },
    });

    const cap = computeXAccountCap(planLimits, workspace.seatCount, workspace.type === 'team');
    if (currentConnections >= cap) {
      return NextResponse.json(
        {
          error: `X account limit reached (${cap} on ${workspace.plan} plan). Upgrade or remove an existing connection.`,
        },
        { status: 403 },
      );
    }

    // Check if this X account is already connected to this workspace
    const existing = await prisma.platformConnection.findFirst({
      where: { workspaceId: workspace.id, platform: 'x', platformUserId: xUserId },
    });

    if (existing && existing.status === 'active') {
      return NextResponse.json(
        { error: 'This X account is already connected to this workspace' },
        { status: 409 },
      );
    }

    // Encrypt tokens
    const encrypted = await encryptOauthToken(accessToken);
    const encryptedRefresh = refreshToken ? await encryptOauthToken(refreshToken) : null;

    let connection;
    if (existing && existing.status === 'dormant') {
      // Reactivate dormant connection
      connection = await prisma.platformConnection.update({
        where: { id: existing.id },
        data: {
          status: 'active',
          keyId: getCurrentKeyId(),
          accessTokenCiphertext: encrypted.ciphertext,
          refreshTokenCiphertext: encryptedRefresh?.ciphertext ?? null,
          platformUsername: xUsername,
          lastVerifiedAt: new Date(),
          disconnectedAt: null,
        },
      });
    } else {
      connection = await prisma.platformConnection.create({
        data: {
          userId: user.id,
          platform: 'x',
          platformUserId: xUserId,
          platformUsername: xUsername,
          accessToken: '**encrypted**',
          scopes: JSON.stringify(['tweet.read', 'users.read']),
          workspaceId: workspace.id,
          status: 'active',
          keyId: getCurrentKeyId(),
          accessTokenCiphertext: encrypted.ciphertext,
          refreshTokenCiphertext: encryptedRefresh?.ciphertext ?? null,
          lastVerifiedAt: new Date(),
        },
      });
    }

    await logSecurityEvent({
      category: 'account',
      eventType: 'x_account_connected',
      userId: user.id,
      workspaceId: workspace.id,
      metadata: { platform_connection_id: connection.id },
      ip: getClientIp(request.headers),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({
      connected: true,
      connectionId: connection.id,
      xUsername: connection.platformUsername,
    });
  } catch (error) {
    console.error('[connect-x] Error:', error);
    return NextResponse.json({ error: 'Failed to connect X account' }, { status: 500 });
  }
}

/**
 * DELETE /api/connect-x
 *
 * Disconnects (soft-archives) an X account from a workspace.
 * Scans tied to this connection become dormant.
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { connectionId } = (await request.json()) as { connectionId: string };
    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId required' }, { status: 400 });
    }

    const connection = await prisma.platformConnection.findUnique({
      where: { id: connectionId },
    });

    if (!connection || connection.userId !== user.id) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }

    // Soft-archive: mark dormant, set disconnectedAt
    await prisma.platformConnection.update({
      where: { id: connectionId },
      data: {
        status: 'dormant',
        disconnectedAt: new Date(),
      },
    });

    // Mark all scans for this connection as dormant
    await prisma.brandScan.updateMany({
      where: { platformConnectionId: connectionId },
      data: { status: 'dormant' },
    });

    await logSecurityEvent({
      category: 'account',
      eventType: 'x_account_disconnected',
      userId: user.id,
      workspaceId: connection.workspaceId ?? undefined,
      metadata: { platform_connection_id: connectionId },
      ip: getClientIp(request.headers),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ disconnected: true });
  } catch (error) {
    console.error('[connect-x] Delete error:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
