import { NextRequest, NextResponse } from 'next/server';
import { ConnectPlatformRequestSchema } from '@/lib/cross-platform/schemas';
import {
  initializeConnectors,
  getConnector,
  getAvailableConnectors,
} from '@/lib/cross-platform/connectors';
import { PLATFORM_LABELS } from '@/lib/cross-platform/types';

/**
 * GET /api/cross-platform/connect
 * List available platform connectors and their auth URLs.
 */
export async function GET() {
  initializeConnectors();
  const available = getAvailableConnectors();

  return NextResponse.json({
    platforms: available.map((p) => ({
      platform: p,
      label: PLATFORM_LABELS[p],
    })),
    message: `${available.length} platform connectors available.`,
  });
}

/**
 * POST /api/cross-platform/connect
 * Exchange an OAuth authorization code for access tokens.
 */
export async function POST(request: NextRequest) {
  try {
    initializeConnectors();

    const body = await request.json();
    const parsed = ConnectPlatformRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { platform, authCode, redirectUri } = parsed.data;
    const connector = getConnector(platform);

    if (!connector) {
      return NextResponse.json(
        {
          error: `Platform "${platform}" connector is not configured.`,
          hint: 'Ensure the required environment variables are set.',
        },
        { status: 400 }
      );
    }

    const tokens = await connector.exchangeCode(authCode);
    const profile = await connector.fetchProfile(tokens.accessToken);

    return NextResponse.json({
      platform,
      profile: {
        platformUserId: profile.platformUserId,
        platformUsername: profile.platformUsername,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        followerCount: profile.followerCount,
        profileUrl: profile.profileUrl,
      },
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
      },
      connectedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Platform connection error:', error);
    return NextResponse.json(
      {
        error: 'Failed to connect platform',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
