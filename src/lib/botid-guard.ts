// ============================================================================
// botid-guard — server-side BotID enforcement with internal-service bypass
//
// Usage (top of a protected handler):
//   const botBlock = await botGuard(request);
//   if (botBlock) return botBlock;
//
// The route must ALSO be listed in src/instrumentation-client.ts (client
// init) — checkBotId only classifies requests that carry the client signal;
// without the client entry, real users get flagged as bots.
//
// Bypass: trusted server-to-server callers (smoke tests, the BrandOS CLI
// skill, internal crons) authenticate with the INTERNAL_API_SECRET header —
// same pattern as /api/x-tweets. Local dev always classifies as HUMAN
// (BotID's documented local-development behavior).
// ============================================================================

import { NextResponse } from 'next/server';
import { checkBotId } from 'botid/server';
import { isInternalRequest } from '@/lib/internal-auth';

export async function botGuard(request: Request): Promise<NextResponse | null> {
  if (isInternalRequest(request)) return null;

  const verification = await checkBotId();
  if (verification.isBot) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  return null;
}
