import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { botGuard } from '@/lib/botid-guard';
import { computeBrandScore } from '@/lib/brand-score';

/**
 * Brand Score API - profile + recent posts analysis (logic in src/lib/brand-score.ts)
 */
async function handlePost(request: NextRequest) {
  try {
    const botBlock = await botGuard(request);
    if (botBlock) return botBlock;

    const { username, forceReevaluate = false } = (await request.json()) as {
      username: string;
      forceReevaluate?: boolean;
    };

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const result = await computeBrandScore(username, request.nextUrl.origin, forceReevaluate);
    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error('Brand Score API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePost, rateLimiters.ai);
