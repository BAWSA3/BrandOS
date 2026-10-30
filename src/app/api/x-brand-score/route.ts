import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { botGuard } from '@/lib/botid-guard';
import { computeBrandScore } from '@/lib/brand-score';
import { quotaFor, refundScan, scanSubject, takeScan } from '@/lib/scan-quota';
import { limitBody } from '@/lib/scan-quota-rules';

/**
 * Brand Score API - profile + recent posts analysis (logic in src/lib/brand-score.ts)
 *
 * The homepage scan. A fresh read counts toward the daily scan limit
 * (src/lib/scan-quota.ts): 1 signed out, 3 free, unlimited paid. A cached
 * score or a failed read gives the scan back. The response carries the posts
 * the read was scored from (`tweets`), so the homepage doesn't fetch them a
 * second time.
 */
async function handlePost(request: NextRequest) {
  try {
    const botBlock = await botGuard(request);
    if (botBlock) return botBlock;

    // forceReevaluate is NOT read from the body: it skips the cache, score
    // smoothing and the archetype lock, so it's admin-only (/api/archetype).
    const { username } = (await request.json()) as { username: string };

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const subject = await scanSubject(request.headers);
    if (!(await takeScan(subject))) {
      const now = new Date();
      return NextResponse.json(limitBody(await quotaFor(subject, now), now), { status: 429 });
    }

    const result = await computeBrandScore(username, request.nextUrl.origin);
    const meta = result.body.meta as { cached?: boolean } | undefined;
    if (result.status !== 200 || meta?.cached) await refundScan(subject);
    const body = result.tweets ? { ...result.body, tweets: result.tweets } : result.body;
    return NextResponse.json(body, { status: result.status });
  } catch (error) {
    console.error('Brand Score API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePost, rateLimiters.ai);
export const maxDuration = 90;
