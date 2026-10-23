import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { botGuard } from '@/lib/botid-guard';
import { withRateLimit, withUserRateLimit, rateLimiters } from '@/lib/rate-limit';
import { indexOpenFor, parseJoin } from '@/lib/index-rules';
import { joinIndex } from '@/lib/creator-index';

/**
 * POST /api/index/join { niches, blurb, allowStale? } — join (or update) the
 * BrandOS Creator Index.
 *
 * Security:
 * - 404 while the Index is closed (INDEX_ENABLED), except for admins.
 * - Auth required; the entry is always the signed-in user's own X handle and
 *   saved brand read (no handle or score is accepted from the request).
 * - Niches from a fixed list, a one-line blurb (≤140, control chars removed);
 *   nothing here reaches an LLM.
 * - BotID + 10/min per IP + 10/min per user. No X or AI calls (a stale read is
 *   refreshed by the client through /api/dashboard/rescan, with its own limits).
 */
async function handlePost(request: NextRequest) {
  const user = await getCurrentUser().catch(() => null);
  if (!indexOpenFor(user)) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;
  if (!user)
    return NextResponse.json({ error: 'Sign in with X to join the Index.' }, { status: 401 });
  if (withUserRateLimit(user.id, 'burst').limited)
    return NextResponse.json({ error: 'Too many tries. Wait a moment.' }, { status: 429 });

  const raw = (await request.json().catch(() => null)) as { allowStale?: unknown } | null;
  const parsed = parseJoin(raw);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const result = await joinIndex(user, parsed.value, { allowStale: raw?.allowStale === true });
  if (!result.ok)
    return NextResponse.json(
      { error: result.error, needsScan: result.needsScan ?? false },
      { status: result.status }
    );
  return NextResponse.json({ number: result.number, created: result.created });
}

export const POST = withRateLimit(handlePost, rateLimiters.burst);
