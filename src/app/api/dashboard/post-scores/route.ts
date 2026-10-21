import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { hasPro, PRO_REQUIRED } from '@/lib/billing';
import { botGuard } from '@/lib/botid-guard';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { scoreLatestPosts } from '@/lib/post-scores';

/**
 * POST /api/dashboard/post-scores — "Analyze my latest posts": score the signed-in
 * user's newest unscored X posts for brand fit (src/lib/post-scores.ts).
 *
 * Auth required; only the user's own connected X account. AI cost surface:
 * BotID + 5/min per IP + at most RUNS_PER_DAY batches of new scores per user
 * per day (a run that finds nothing new costs no model call and isn't counted).
 */

const RUNS_PER_DAY = 4;
const DAY_MS = 86_400_000;

async function handlePost(request: NextRequest) {
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in to analyze your posts' }, { status: 401 });
  if (!hasPro(user)) return NextResponse.json(PRO_REQUIRED, { status: 402 });

  try {
    // each run inserts its rows with one analyzedAt instant: count distinct runs today
    const runs = await prisma.postScore.groupBy({
      by: ['analyzedAt'],
      where: { userId: user.id, analyzedAt: { gt: new Date(Date.now() - DAY_MS) } },
    });
    if (runs.length >= RUNS_PER_DAY) {
      return NextResponse.json(
        { error: 'You’ve analyzed your posts a few times today. Try again tomorrow.' },
        { status: 429 }
      );
    }
    const { scored } = await scoreLatestPosts(user.id);
    return NextResponse.json({ scored });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed';
    console.error('[dashboard/post-scores] failed:', error);
    return NextResponse.json({ error: message.slice(0, 200) }, { status: 502 });
  }
}

export const POST = withRateLimit(handlePost, rateLimiters.aiStrict);
