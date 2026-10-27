import { NextRequest, NextResponse, after } from 'next/server';
import { Resend } from 'resend';
import { ingestInboundEmail, triageAndDraft } from '@/lib/support-inbox';

/**
 * POST /api/webhook/resend-inbound — Resend `email.received` events.
 * Replies to our emails (EMAIL_REPLY_TO on a Resend receiving domain) land in
 * the support inbox (/admin → Inbox), and the support agent drafts an answer
 * after the response. Signed with RESEND_INBOUND_WEBHOOK_SECRET (Svix); no
 * secret, no processing. Nothing is ever sent from here.
 */
export const maxDuration = 60;

const MAX_BODY_BYTES = 64_000;

export async function POST(request: NextRequest) {
  const secret = process.env.RESEND_INBOUND_WEBHOOK_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  if (!secret || !apiKey)
    return NextResponse.json({ error: 'Inbound email is not configured' }, { status: 503 });

  const payload = await request.text();
  if (payload.length > MAX_BODY_BYTES)
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });

  let event: { type?: string; data?: { email_id?: string } };
  try {
    event = new Resend(apiKey).webhooks.verify({
      payload,
      headers: {
        id: request.headers.get('svix-id') ?? '',
        timestamp: request.headers.get('svix-timestamp') ?? '',
        signature: request.headers.get('svix-signature') ?? '',
      },
      webhookSecret: secret,
    }) as typeof event;
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Other event types can share the endpoint; acknowledge and skip them.
  if (event.type !== 'email.received') return NextResponse.json({ received: true });
  const emailId = event.data?.email_id;
  if (typeof emailId !== 'string' || !/^[A-Za-z0-9-]{1,100}$/.test(emailId))
    return NextResponse.json({ error: 'Missing email id' }, { status: 400 });

  try {
    const result = await ingestInboundEmail(emailId);
    // 'unavailable' is worth a retry (Resend fetch failed); the rest are final.
    if (result.status === 'unavailable')
      return NextResponse.json({ error: 'Try again' }, { status: 503 });
    if (result.status === 'stored') after(() => triageAndDraft(result.threadId));
    return NextResponse.json({ received: true, status: result.status });
  } catch (e) {
    console.error('[resend-inbound] failed:', e);
    return NextResponse.json({ error: 'Failed to store email' }, { status: 500 });
  }
}
