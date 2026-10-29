import { NextRequest, NextResponse } from 'next/server';
import { botGuard } from '@/lib/botid-guard';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { saveApplication } from '@/lib/early-access';
import { cleanApplication } from '@/lib/early-access-rules';

/**
 * POST /api/access/apply { handle, email, note? } — "apply for a code" on
 * /access (invite-only trial). Public, so: BotID + the strict per-IP limit,
 * strict validation, and the same answer for new and repeat applications (no
 * list enumeration). Bawsa approves in batches with scripts/invite-codes.ts.
 */
async function handlePost(request: NextRequest) {
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const app = body ? cleanApplication(body) : null;
  if (!app) {
    return NextResponse.json(
      { error: 'Add your X handle and an email we can reach you at.' },
      { status: 400 }
    );
  }
  const result = await saveApplication(app);
  if (result !== 'ok') {
    return NextResponse.json(
      { error: 'Applications open soon. Try again in a bit.' },
      { status: 503 }
    );
  }
  return NextResponse.json({ ok: true });
}

export const POST = withRateLimit(handlePost, rateLimiters.strict);
