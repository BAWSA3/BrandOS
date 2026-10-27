import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import { hasPro, PRO_REQUIRED } from '@/lib/billing';
import { botGuard } from '@/lib/botid-guard';
import { checkRateLimit, rateLimiters, withRateLimit } from '@/lib/rate-limit';
import { DraftScoreError, scoreDraft, validateDraft } from '@/lib/draft-score';

/**
 * POST /api/dashboard/draft-score { text, hasMedia?, tzOffsetMin?, account? }
 * "Score this draft" in the idea board composer and the copywriter.
 * AI cost surface: BotID + the per-IP AI limit + 40 scores per hour per member,
 * a 2,000-character cap, and an hour's cache per draft (repeat scores are free).
 * The brand must be in the member's own workspace.
 */
export const maxDuration = 60;

async function handlePost(request: NextRequest) {
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in to score drafts' }, { status: 401 });
  if (!hasPro(user)) return NextResponse.json(PRO_REQUIRED, { status: 402 });

  const raw = await request.text();
  if (raw.length > 12_000)
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const draft = validateDraft(body);
    if (
      checkRateLimit(`draft-score:${user.id}`, { interval: 60 * 60 * 1000, maxRequests: 40 })
        .limited
    )
      return NextResponse.json(
        { error: 'That is a lot of drafts for one hour. Try again soon.' },
        { status: 429 }
      );
    const workspace = await getCurrentWorkspace(user);
    const result = await scoreDraft({
      userId: user.id,
      workspaceId: workspace?.id ?? null,
      draft,
      accountId:
        typeof body.account === 'string' && body.account.length <= 64 ? body.account : undefined,
    });
    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof DraftScoreError)
      return NextResponse.json({ error: e.message }, { status: e.status });
    console.error('[draft-score] error:', e);
    return NextResponse.json({ error: 'Something went wrong. Try again.' }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePost, rateLimiters.ai);
