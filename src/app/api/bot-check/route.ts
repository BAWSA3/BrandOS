import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { botGuard } from '@/lib/botid-guard';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import {
  BotCheckError,
  cachedBotCheck,
  cleanBotHandle,
  dailyLimit,
  runBotCheck,
  saveBotCheck,
  shapeBotCheck,
  takeBudget,
  viewerFor,
  type BotCheckRecord,
} from '@/lib/bot-check';

/**
 * POST /api/bot-check { handle } — "How many bots follow you?" (/bots).
 * Public. Paid X data surface, so: BotID, a per-IP limit on fresh checks
 * (5/hour) plus a looser one on all requests (40/hour), a global daily budget
 * of fresh checks (BOT_CHECK_DAILY_LIMIT, default 1500), a 7-day cache per
 * handle, and one in-flight check per handle. Private accounts are refused.
 *
 * Exposure: counts for everyone; reason counts for signed-in users; flagged
 * account handles only for the handle's owner (matched by X user id).
 */
export const maxDuration = 60;

const inflight = new Map<string, Promise<BotCheckRecord>>();
const HOUR = 60 * 60 * 1000;

export async function POST(request: NextRequest) {
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;

  const ip = getClientIdentifier(request);
  if (checkRateLimit(`bot-check:all:${ip}`, { interval: HOUR, maxRequests: 40 }).limited)
    return NextResponse.json(
      { error: 'That’s a lot of checks. Try again in a bit.' },
      { status: 429 }
    );

  const body = (await request.json().catch(() => ({}))) as { handle?: unknown };
  const handle = cleanBotHandle(body.handle);
  if (!handle)
    return NextResponse.json({ error: 'Enter an X handle, like @jbawsa.' }, { status: 400 });
  const key = handle.toLowerCase();

  let record = await cachedBotCheck(key);
  if (!record) {
    if (checkRateLimit(`bot-check:fresh:${ip}`, { interval: HOUR, maxRequests: 5 }).limited)
      return NextResponse.json(
        { error: 'You’ve checked 5 accounts this hour. Try again later.' },
        { status: 429 }
      );
    try {
      let job = inflight.get(key);
      if (!job) {
        if (!(await takeBudget(dailyLimit())))
          return NextResponse.json(
            { error: 'So many people are checking right now. Try again in a few hours.' },
            { status: 503 }
          );
        job = runBotCheck(handle).then(async ({ record: r }) => {
          await saveBotCheck(r);
          return r;
        });
        inflight.set(key, job);
        job.finally(() => inflight.delete(key)).catch(() => {});
      }
      record = await job;
    } catch (e) {
      if (e instanceof BotCheckError)
        return NextResponse.json({ error: e.message }, { status: e.status });
      console.error('[bot-check] failed:', e);
      return NextResponse.json({ error: 'The check failed. Try again shortly.' }, { status: 500 });
    }
  }

  const user = await getCurrentUser();
  const viewer = viewerFor(
    user
      ? {
          xUserIds: user.platformConnections
            .filter((c) => c.platform === 'x')
            .map((c) => c.platformUserId),
        }
      : null,
    record
  );
  return NextResponse.json(shapeBotCheck(record, viewer));
}
