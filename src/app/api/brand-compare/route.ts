import { NextRequest, NextResponse } from 'next/server';
import { botGuard } from '@/lib/botid-guard';
import { getCurrentUser } from '@/lib/auth';
import { recordLookup, requestIp } from '@/lib/lookups';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { profileCard } from '@/lib/mcp/profile-read';
import { BrandLookupError, ScanLimitError, compareGaps, readOrScan } from '@/lib/public-brand';
import { quotaFor, scanSubject } from '@/lib/scan-quota';
import { limitBody } from '@/lib/scan-quota-rules';

/**
 * POST /api/brand-compare { me, them } — "Compare your brand to @them" on the
 * public brand page: both public reads (scanning @me if needed) side by side,
 * plus 2-3 lines on what @them does that @me doesn't. No account needed (the
 * sign-up comes after the comparison). BotID + the strict per-IP AI limit;
 * each fresh scan counts toward the daily scan limit (src/lib/scan-quota.ts).
 */
export const maxDuration = 60;

async function handlePost(request: NextRequest) {
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;
  const body = (await request.json().catch(() => ({}))) as { me?: unknown; them?: unknown };
  const me = typeof body.me === 'string' ? body.me.slice(0, 20) : '';
  const them = typeof body.them === 'string' ? body.them.slice(0, 20) : '';
  if (me.replace(/^@/, '').toLowerCase() === them.replace(/^@/, '').toLowerCase())
    return NextResponse.json(
      { error: 'Pick a different handle to compare with.' },
      { status: 400 }
    );
  const viewer = await getCurrentUser().catch(() => null);
  const subject = await scanSubject(request.headers, viewer);
  try {
    const origin = request.nextUrl.origin;
    const [a, b] = await Promise.all([
      readOrScan(me, origin, subject),
      readOrScan(them, origin, subject),
    ]);
    const gaps = await compareGaps(a, b);
    // "your brand was looked up": the compared-against creator (counts only)
    await recordLookup({
      handle: them,
      kind: 'compare',
      viewerUserId: viewer?.id ?? null,
      ip: requestIp(request.headers),
      ua: request.headers.get('user-agent'),
    });
    return NextResponse.json({ me: profileCard(a), them: profileCard(b), gaps });
  } catch (e) {
    if (e instanceof ScanLimitError) {
      const now = new Date();
      return NextResponse.json(limitBody(await quotaFor(subject, now), now), { status: 429 });
    }
    if (e instanceof BrandLookupError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[brand-compare] failed:', e);
    return NextResponse.json(
      { error: 'The comparison failed. Try again shortly.' },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(handlePost, rateLimiters.aiStrict);
