import { NextRequest, NextResponse } from 'next/server';
import { botGuard } from '@/lib/botid-guard';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { profileCard } from '@/lib/mcp/profile-read';
import { BrandLookupError, ScanLimitError, readOrScan } from '@/lib/public-brand';
import { quotaFor, scanSubject } from '@/lib/scan-quota';
import { limitBody } from '@/lib/scan-quota-rules';

/**
 * POST /api/public-brand { handle } — the public brand page's data
 * (mybrandos.app/@handle): a public scan under 7 days old, else a fresh scan.
 * Public scan data only. BotID + the same per-IP AI limit as the homepage scan;
 * a fresh scan counts toward the daily scan limit (src/lib/scan-quota.ts).
 */
export const maxDuration = 60;

async function handlePost(request: NextRequest) {
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;
  const body = (await request.json().catch(() => ({}))) as { handle?: unknown };
  const handle = typeof body.handle === 'string' ? body.handle.slice(0, 20) : '';
  const subject = await scanSubject(request.headers);
  try {
    const read = await readOrScan(handle, request.nextUrl.origin, subject);
    return NextResponse.json({ card: profileCard(read) });
  } catch (e) {
    if (e instanceof ScanLimitError) {
      const now = new Date();
      return NextResponse.json(limitBody(await quotaFor(subject, now), now), { status: 429 });
    }
    if (e instanceof BrandLookupError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[public-brand] failed:', e);
    return NextResponse.json({ error: 'The scan failed. Try again shortly.' }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePost, rateLimiters.ai);
