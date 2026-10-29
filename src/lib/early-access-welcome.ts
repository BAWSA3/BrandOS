import { after } from 'next/server';
import prisma from '@/lib/db';
import { CODE_TRIAL } from '@/lib/early-access-rules';
import {
  CAMPAIGNS,
  earlyAccessWelcomeContent,
  renderEarlyAccessWelcomeEmail,
  sendOnce,
  sendTransactionalTo,
  type SendResult,
} from '@/lib/launch-emails';

/**
 * The automatic "you're in" email, sent once when someone redeems an
 * early-access code. Server-only.
 *
 * It goes to the list signup the code was given to (the code's label is
 * "@handle", and codes went out as replies to that signup's address), falling
 * back to the redeemer's own list signup (by handle or account email). sendOnce()
 * makes it at most one per signup, however many times redemption is retried.
 *
 * Friend codes and member invites usually have no list signup: then it goes
 * to the redeemer's account email directly (sendTransactionalTo), without
 * adding them to the list. "Once" there is the redemption itself: this runs
 * only after a fresh, single-use redemption. An address that unsubscribed
 * from the list is never emailed.
 *
 * Off when EARLY_ACCESS_WELCOME=off, and until EMAIL_REPLY_TO is set: the
 * email asks for a reply, and mybrandos.app has no inbox.
 */

export type WelcomeResult = SendResult | 'off' | 'no-code' | 'no-address';

export function welcomeEnabled(): boolean {
  return process.env.EARLY_ACCESS_WELCOME !== 'off' && !!process.env.EMAIL_REPLY_TO;
}

const bare = (h: string | null | undefined) => h?.trim().replace(/^@/, '').toLowerCase() || null;

async function signupFor(handle: string | null, email: string | null) {
  const where = [
    ...(handle ? [{ xUsername: { equals: handle, mode: 'insensitive' as const } }] : []),
    ...(email ? [{ email: { equals: email, mode: 'insensitive' as const } }] : []),
  ];
  if (!where.length) return null;
  for (const w of where) {
    const s = await prisma.emailSignup.findFirst({
      where: { ...w, unsubscribed: { not: true } },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });
    if (s) return s;
  }
  return null;
}

export async function sendEarlyAccessWelcome(userId: string): Promise<WelcomeResult> {
  if (!welcomeEnabled()) return 'off';
  const code = await prisma.earlyAccessCode.findUnique({
    where: { redeemedByUserId: userId },
    select: {
      label: true,
      revokedAt: true,
      redeemedBy: { select: { email: true, xUsername: true } },
    },
  });
  if (!code || code.revokedAt) return 'no-code';

  // Labels are "@handle", or the address for a list signup with no handle.
  const labelEmail = code.label.includes('@', 1) ? code.label.trim() : null;
  const givenTo = labelEmail ? null : bare(code.label);
  const redeemer = bare(code.redeemedBy?.xUsername);
  const toOwner = await signupFor(givenTo, labelEmail);
  const signup = toOwner ?? (await signupFor(redeemer, code.redeemedBy?.email ?? null));
  if (!signup) {
    // not on the list (friend code, member invite): the account email, if any
    const email = code.redeemedBy?.email?.trim();
    if (!email) return 'no-address';
    const optedOut = await prisma.emailSignup.findFirst({
      where: { email: { equals: email, mode: 'insensitive' }, unsubscribed: true },
      select: { id: true },
    });
    if (optedOut) return 'no-address';
    const recipient = { handle: redeemer, usedBy: null, codeTrial: CODE_TRIAL };
    return sendTransactionalTo(
      email,
      CAMPAIGNS.earlyAccessWelcome,
      earlyAccessWelcomeContent(recipient),
      renderEarlyAccessWelcomeEmail(recipient, email)
    );
  }

  // Emailing the code's owner about someone else using it: say so.
  const usedBy = toOwner && givenTo && redeemer && givenTo !== redeemer ? redeemer : null;
  const recipient = {
    handle: toOwner && givenTo ? givenTo : redeemer,
    usedBy,
    codeTrial: CODE_TRIAL,
  };
  return sendOnce(
    signup.id,
    CAMPAIGNS.earlyAccessWelcome,
    () => earlyAccessWelcomeContent(recipient),
    (_content, email) => renderEarlyAccessWelcomeEmail(recipient, email)
  );
}

/**
 * Queue the welcome after the response, so redemption never waits on (or
 * fails because of) email. Call only after a fresh redemption.
 */
export function welcomeAfterRedeem(userId: string): void {
  const run = () =>
    sendEarlyAccessWelcome(userId)
      .then((r) => {
        if (r === 'failed' || r === 'no-address') console.warn('[early-access] welcome email:', r);
      })
      .catch((e) => console.error('[early-access] welcome email failed', e));
  try {
    after(run);
  } catch {
    // outside a request (scripts): just run it
    void run();
  }
}
