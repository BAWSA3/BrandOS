import { NextRequest, NextResponse } from 'next/server';
import { botGuard } from '@/lib/botid-guard';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { getCurrentUser } from '@/lib/auth';
import { recordLookup, requestIp } from '@/lib/lookups';

/**
 * POST /api/brand-lookup { handle } — the public /@handle page's view beacon.
 * Sent from the browser after the page loads (link-preview crawlers don't run
 * it), behind BotID + a per-IP limit, deduped per viewer per day, and never
 * counted when the owner views their own page. Writes a count only.
 */
async function handlePost(request: NextRequest) {
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;
  const body = (await request.json().catch(() => ({}))) as { handle?: unknown };
  const handle = typeof body.handle === 'string' ? body.handle.slice(0, 21) : '';
  const user = await getCurrentUser().catch(() => null);
  await recordLookup({
    handle,
    kind: 'page',
    viewerUserId: user?.id ?? null,
    ip: requestIp(request.headers),
    ua: request.headers.get('user-agent'),
  });
  return new NextResponse(null, { status: 204 });
}

export const POST = withRateLimit(handlePost, rateLimiters.standard);
