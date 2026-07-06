/**
 * POST /api/audit/run
 *
 * Runs the Score Boost Audit for a handle — only after verifying the
 * Stripe session is paid. Returns the full audit JSON.
 *
 * Called by /audit/[session] page on first load. Not cached server-side
 * for v1 — regeneration cost is ~$0.05 per run and users get the MD
 * emailed after first run so they don't need to come back.
 *
 * Input: { sessionId }
 * Output: ScoreBoostAuditResult
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { stripe } from '@/lib/stripe';
import { fetchTweetsByUsername } from '@/lib/socialdata';
import { buildAuditPrompt } from '@/prompts/score-boost-audit';
import { sendAuditEmail } from '@/lib/audit-email';
import { parseAudit } from '@/lib/score-schemas';
import { assertCanScan } from '@/lib/scan-guard';
import { logSecurityEvent, getClientIp } from '@/lib/audit-log';
import { botGuard } from '@/lib/botid-guard';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

export async function POST(request: NextRequest) {
  try {
    const botBlock = await botGuard(request);
    if (botBlock) return botBlock;

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
    }

    const { sessionId } = (await request.json()) as { sessionId?: string };
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
    }

    // 1) Verify the session is paid and matches our product
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
    }
    if (session.metadata?.productType !== 'SCORE_BOOST_AUDIT') {
      return NextResponse.json(
        { error: 'Session is not for a Score Boost Audit' },
        { status: 400 }
      );
    }

    const handle = session.metadata?.handle;
    if (!handle) {
      return NextResponse.json({ error: 'Handle missing from session metadata' }, { status: 400 });
    }

    // 1b) Phase 1: verify authenticated user owns this handle
    const guard = await assertCanScan(handle);
    if (!guard.allowed) {
      await logSecurityEvent({
        category: 'scan',
        eventType: 'audit_rejected',
        success: false,
        metadata: { error_code: guard.code, route: '/api/audit/run' },
        ip: getClientIp(request.headers),
        userAgent: request.headers.get('user-agent'),
      });
      return NextResponse.json({ error: guard.error }, { status: guard.status });
    }

    // 2) Fetch last 50 tweets
    const tweetResult = await fetchTweetsByUsername(handle, 50);
    if (tweetResult.error || tweetResult.tweets.length === 0) {
      return NextResponse.json(
        { error: `Could not fetch tweets: ${tweetResult.error || 'empty'}` },
        { status: 502 }
      );
    }

    const tweets = tweetResult.tweets
      .filter((t) => t.text && t.text.length > 10)
      .slice(0, 50)
      .map((t) => ({
        text: t.text,
        likes: t.public_metrics.like_count,
        replies: t.public_metrics.reply_count,
        retweets: t.public_metrics.retweet_count,
      }));

    if (tweets.length < 5) {
      return NextResponse.json(
        { error: 'Not enough tweets to audit (need at least 5)' },
        { status: 422 }
      );
    }

    // 3) Call Claude Haiku
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Anthropic API not configured' }, { status: 503 });
    }

    const anthropic = new Anthropic({ apiKey });
    const prompt = buildAuditPrompt(handle, tweets);

    const message = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0]?.type === 'text' ? message.content[0].text : '';

    // Validate + clamp model output (no untyped JSON.parse). A paid audit gets
    // NO heuristic fallback — error out rather than serve garbage to a customer.
    const audit = parseAudit(text);
    if (!audit) {
      console.error('[audit/run] Output failed validation:', text.slice(0, 500));
      return NextResponse.json(
        { error: 'Audit generation failed — invalid response, please retry' },
        { status: 502 }
      );
    }

    // Fire-and-forget email delivery — don't block the response
    const buyerEmail = session.customer_details?.email || null;
    if (buyerEmail) {
      sendAuditEmail({
        to: buyerEmail,
        audit,
        sessionId,
      }).catch((err) => {
        console.error('[audit/run] Email send failed (non-blocking):', err);
      });
    }

    return NextResponse.json({
      audit,
      email: buyerEmail,
    });
  } catch (error) {
    console.error('[audit/run] Error:', error);
    const errMessage = error instanceof Error ? error.message : 'Unknown error';
    const isDev = process.env.NODE_ENV !== 'production';
    return NextResponse.json(
      {
        error: isDev ? `Audit run failed: ${errMessage}` : 'Audit run failed',
      },
      { status: 500 }
    );
  }
}
