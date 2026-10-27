import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { hasPro } from '@/lib/billing';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { bearer, extensionCors, verifyExtensionToken } from '@/lib/extension-token';
import { DraftScoreError, scoreDraft, validateDraft } from '@/lib/draft-score';

/**
 * POST /api/extension/score { text, hasMedia?, tzOffsetMin? }
 * BrandOS for Chrome: score the draft in X's composer. Same engine as "Score
 * this draft" on the dashboard (src/lib/draft-score.ts), for the member's own
 * brand. Auth: the extension token (scoped, 30 days). Cost surface: 12 per
 * minute per IP, 20 per minute and 40 per hour per member (shared with the
 * dashboard), a 2,000-character cap and an hour's cache per draft.
 *
 * Invite-only (INVITE_ONLY): tokens are minted only for existing BrandOS
 * accounts (/api/extension/token needs a signed-in User), so the extension can
 * never create or reach an account the sign-in gate turned away.
 */
export const maxDuration = 60;

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: extensionCors(request.headers.get('origin')),
  });
}

export async function POST(request: NextRequest) {
  const headers = extensionCors(request.headers.get('origin'));
  if (
    checkRateLimit(`ext-score-ip:${getClientIdentifier(request)}`, {
      interval: 60_000,
      maxRequests: 12,
    }).limited
  )
    return NextResponse.json({ error: 'Slow down a little.' }, { status: 429, headers });
  const userId = verifyExtensionToken(bearer(request));
  if (!userId) return NextResponse.json({ error: 'Sign in again' }, { status: 401, headers });

  const user = await prisma.user
    .findUnique({ where: { id: userId }, include: { ownedWorkspaces: true } })
    .catch(() => null);
  if (!user) return NextResponse.json({ error: 'Sign in again' }, { status: 401, headers });
  if (!hasPro(user))
    return NextResponse.json(
      { error: 'Draft scoring is part of BrandOS Pro.', pro: false },
      { status: 402, headers }
    );

  const raw = await request.text();
  if (raw.length > 12_000)
    return NextResponse.json({ error: 'Request too large' }, { status: 413, headers });
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers });
  }

  try {
    const draft = validateDraft(body);
    if (
      checkRateLimit(`ext-score:${user.id}`, { interval: 60_000, maxRequests: 20 }).limited ||
      checkRateLimit(`draft-score:${user.id}`, { interval: 60 * 60 * 1000, maxRequests: 40 })
        .limited
    )
      return NextResponse.json(
        { error: 'That is a lot of drafts for one hour. Try again soon.' },
        { status: 429, headers }
      );
    const personal = user.ownedWorkspaces.find((w) => w.type === 'personal') ?? null;
    const r = await scoreDraft({ userId: user.id, workspaceId: personal?.id ?? null, draft });
    return NextResponse.json(
      {
        score: r.score,
        verdict: r.verdict,
        format: r.format,
        formatLift: r.formatLift,
        reach: r.reach,
        fixes: r.fixes,
        voice: r.voice,
        hook: r.hook,
        handle: r.handle,
        basedOn: r.basedOn,
        cached: r.cached,
      },
      { headers: { ...headers, 'Cache-Control': 'no-store' } }
    );
  } catch (e) {
    if (e instanceof DraftScoreError)
      return NextResponse.json({ error: e.message }, { status: e.status, headers });
    console.error('[extension/score] error:', e);
    return NextResponse.json(
      { error: 'Something went wrong. Try again.' },
      { status: 500, headers }
    );
  }
}
