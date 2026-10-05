import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { CAMPAIGNS, POLL_CHOICES, verifyPollToken, type PollChoice } from '@/lib/launch-emails';

/**
 * POST /api/poll/vote: records a launch-email "would you pay?" vote.
 *
 * Auth is the signed token from the email link (HMAC over the signup id), so
 * votes can't be forged or cast for someone else. Called by /poll on page
 * load, never by a bare GET, so email link scanners that prefetch URLs don't
 * cast votes. One vote per signup; clicking another option changes it.
 */
async function handlePost(request: NextRequest) {
  let body: { t?: unknown; c?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const token = typeof body.t === 'string' && body.t.length <= 200 ? body.t : '';
  const choice = POLL_CHOICES.includes(body.c as PollChoice) ? (body.c as PollChoice) : null;
  const signupId = token ? verifyPollToken(token) : null;
  if (!signupId || !choice) {
    return NextResponse.json({ error: 'This link is invalid or expired' }, { status: 400 });
  }

  try {
    const exists = await prisma.emailSignup.findUnique({
      where: { id: signupId },
      select: { id: true },
    });
    if (!exists) {
      return NextResponse.json({ error: 'This link is invalid or expired' }, { status: 400 });
    }
    await prisma.pricingPollVote.upsert({
      where: { emailSignupId: signupId },
      create: { emailSignupId: signupId, choice, campaign: CAMPAIGNS.launch },
      update: { choice },
    });
    return NextResponse.json({ ok: true, choice });
  } catch (error) {
    console.error('[poll/vote] Failed:', error);
    return NextResponse.json({ error: 'Could not record your vote' }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePost, rateLimiters.strict);
