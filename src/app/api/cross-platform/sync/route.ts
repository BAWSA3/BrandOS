import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SocialPlatformSchema } from '@/lib/cross-platform/schemas';
import {
  initializeConnectors,
  getConnector,
} from '@/lib/cross-platform/connectors';

const SyncRequestSchema = z.object({
  platform: SocialPlatformSchema,
  accessToken: z.string().min(1),
  maxResults: z.number().min(1).max(100).optional(),
});

/**
 * POST /api/cross-platform/sync
 * Fetch recent content from a connected platform.
 */
export async function POST(request: NextRequest) {
  try {
    initializeConnectors();

    const body = await request.json();
    const parsed = SyncRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { platform, accessToken, maxResults } = parsed.data;
    const connector = getConnector(platform);

    if (!connector) {
      return NextResponse.json(
        { error: `Platform "${platform}" connector is not configured.` },
        { status: 400 }
      );
    }

    const content = await connector.fetchContent(accessToken, { maxResults });

    return NextResponse.json({
      platform,
      items: content,
      count: content.length,
      syncedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Platform sync error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync platform content',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
