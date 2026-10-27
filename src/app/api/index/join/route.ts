import { NextRequest, NextResponse, after } from 'next/server';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import { botGuard } from '@/lib/botid-guard';
import { withRateLimit, withUserRateLimit, rateLimiters } from '@/lib/rate-limit';
import { parseJoin } from '@/lib/index-rules';
import { indexOpenForUser } from '@/lib/early-access';
import { joinIndex } from '@/lib/creator-index';
import { captureFunnelEvent } from '@/lib/funnel-events';
import { rescanOwnBrand } from '@/lib/brand-rescan';

/**
 * POST /api/index/join { niches, blurb } — join (or update) the BrandOS
 * Creator Index. Joins right away with the saved brand read; a read older than
 * 7 days is refreshed after the response (the member's card updates when the
 * new read lands). With no read at all the client scans first (409 needsScan).
 *
 * Security:
 * - 404 while the Index is closed (INDEX_ENABLED), except for admins.
 * - Auth required; the entry is always the signed-in user's own X handle and
 *   saved brand read (no handle or score is accepted from the request).
 * - Niches from a fixed list, a one-line blurb (≤140, control chars removed);
 *   nothing here reaches an LLM.
 * - BotID + 10/min per IP + 10/min per user. The only X/AI cost is the
 *   background refresh of a stale read: at most one per join, through
 *   rescanOwnBrand (Pro for rescans, 5 saved scans/user/day, the scorer's 6h
 *   cache). A failed refresh is logged and never touches the join.
 */
async function handlePost(request: NextRequest) {
  const user = await getCurrentUser().catch(() => null);
  if (!(await indexOpenForUser(user)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;
  if (!user)
    return NextResponse.json({ error: 'Sign in with X to join the Index.' }, { status: 401 });
  if (withUserRateLimit(user.id, 'burst').limited)
    return NextResponse.json({ error: 'Too many tries. Wait a moment.' }, { status: 429 });

  const parsed = parseJoin(await request.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const result = await joinIndex(user, parsed.value);
  if (!result.ok)
    return NextResponse.json(
      { error: result.error, needsScan: result.needsScan ?? false },
      { status: result.status }
    );
  await captureFunnelEvent(user.supabaseId, 'index_joined', {
    number: result.number,
    created: result.created,
    niches: parsed.value.niches.join(','),
  });
  if (result.stale) {
    const origin = request.nextUrl.origin;
    const workspace = await getCurrentWorkspace(user).catch(() => null);
    after(async () => {
      try {
        const r = await rescanOwnBrand(user, workspace, origin);
        if (!r.ok) console.warn('[index/join] background refresh skipped:', r.status, r.error);
      } catch (e) {
        console.error('[index/join] background refresh failed:', e);
      }
    });
  }
  return NextResponse.json({
    number: result.number,
    created: result.created,
    refreshing: result.stale,
    joinedAt: result.joinedAt.toISOString(),
    archetype: result.archetype,
  });
}

export const POST = withRateLimit(handlePost, rateLimiters.burst);
