import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import { PRO_REQUIRED } from '@/lib/billing';
import { botGuard } from '@/lib/botid-guard';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { rescanOwnBrand } from '@/lib/brand-rescan';
import { quotaFor, refundScan, scanSubject, takeScan } from '@/lib/scan-quota';
import { limitBody } from '@/lib/scan-quota-rules';

/**
 * POST /api/dashboard/rescan — the signed-in user rescans their own brand from
 * the dashboard, and the result is saved to their account (BrandScan), which
 * is what the dashboard's score, history, phases and XP read.
 *
 * Security:
 * - Auth required; scans ONLY the user's own active X connection (no handle
 *   is accepted from the request).
 * - AI cost surface: BotID + 5/min per IP, plus the rules in
 *   src/lib/brand-rescan.ts (Pro for rescans, RESCANS_PER_DAY, the scorer's
 *   6h cache), and for members who aren't paying, the daily scan limit
 *   (src/lib/scan-quota.ts): a saved fresh read counts toward their 3 a day.
 */

async function handlePost(request: NextRequest) {
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in to rescan' }, { status: 401 });

  const subject = await scanSubject(request.headers, user);
  if (!(await takeScan(subject))) {
    const now = new Date();
    return NextResponse.json(limitBody(await quotaFor(subject, now), now), { status: 429 });
  }
  try {
    const workspace = await getCurrentWorkspace(user);
    const r = await rescanOwnBrand(user, workspace, request.nextUrl.origin);
    if (!r.ok || !r.saved || r.cached) await refundScan(subject);
    if (!r.ok) {
      return NextResponse.json(r.pro ? PRO_REQUIRED : { error: r.error }, { status: r.status });
    }
    return NextResponse.json(
      r.saved
        ? { saved: true, cached: r.cached, score: r.score, quick: r.quick }
        : { saved: false, cached: true, score: r.score }
    );
  } catch (error) {
    await refundScan(subject);
    console.error('[dashboard/rescan] failed:', error);
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePost, rateLimiters.aiStrict);
