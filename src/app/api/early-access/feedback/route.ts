import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { sendEmail } from '@/lib/email';
import { escapeHtml } from '@/lib/email-safety';
import { earlyAccessFor, teamInbox } from '@/lib/early-access';
import { cleanFeedback } from '@/lib/early-access-rules';

/**
 * POST /api/early-access/feedback { message, page? } — "Send feedback to
 * Bawsa" for early-access testers. Signed in, with a redeemed code that has the
 * tester perk. Stored (TesterFeedback) and emailed to the team inbox, escaped
 * and length-capped, with Reply-To set to the tester so Bawsa can answer from
 * the inbox. 5 messages an hour per tester.
 */
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const access = await earlyAccessFor(user.id);
  if (!access?.perkTester) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (
    checkRateLimit(`ea-feedback:${user.id}`, { interval: 60 * 60 * 1000, maxRequests: 5 }).limited
  ) {
    return NextResponse.json(
      { error: 'That’s a lot of notes. Try again in an hour.' },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => null)) as {
    message?: unknown;
    page?: unknown;
  } | null;
  const message = cleanFeedback(body?.message);
  if (!message) return NextResponse.json({ error: 'Write a note first.' }, { status: 400 });
  const page =
    typeof body?.page === 'string' && /^\/[\w\-/@?=&.%]{0,200}$/.test(body.page) ? body.page : null;

  try {
    await prisma.testerFeedback.create({ data: { userId: user.id, message, page } });
  } catch (e) {
    console.error('[early-access] feedback not stored', e);
    return NextResponse.json({ error: 'Couldn’t send that. Try again.' }, { status: 500 });
  }

  const who = user.xUsername ? `@${user.xUsername}` : (user.email ?? user.id);
  // Reply goes straight to the tester (only a plain, single-line address).
  const email =
    user.email && /^[^\s@<>,;"]+@[^\s@<>,;"]+\.[^\s@<>,;"]{2,}$/.test(user.email)
      ? user.email
      : null;
  await sendEmail(
    teamInbox(),
    `[Tester feedback] ${who.replace(/[\r\n]+/g, ' ').slice(0, 80)}`,
    [
      `**Feedback from ${escapeHtml(who)}**`,
      email
        ? `Email: ${escapeHtml(email)} (hit Reply to answer them)`
        : 'No email on file: reply on X.',
      page ? `Page: ${escapeHtml(page)}` : '',
      ``,
      ...escapeHtml(message).split('\n'),
      ``,
      `---`,
      `Sent ${new Date().toISOString()}`,
    ].join('\n'),
    undefined,
    email ? { replyTo: email } : {}
  ).catch((e) => console.error('[early-access] feedback email failed', e));

  return NextResponse.json({ ok: true });
}
