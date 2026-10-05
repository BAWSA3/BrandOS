import { createHmac, timingSafeEqual } from 'crypto';
import { Resend } from 'resend';
import prisma from '@/lib/db';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import { renderNewsletter, type NewsletterContent } from '@/lib/newsletter-template';

/**
 * Launch-week email (Oct 2026): the instant "your station is reserved"
 * confirmation and the launch-day "would you pay?" email with a one-click
 * pricing poll. Server-only.
 *
 * Every send goes through sendOnce(): it claims an EmailSend row
 * (unique per signup + campaign) BEFORE calling Resend, so each address gets a
 * campaign at most once. That's what stops the public reserve form being used
 * to spam someone, and it makes the launch script safe to re-run.
 */

export const CAMPAIGNS = {
  reserveConfirm: 'reserve-confirm',
  launch: 'launch-2026-10-08',
} as const;

export const POLL_CHOICES = ['standard', 'premium', 'founding', 'not-yet'] as const;
export type PollChoice = (typeof POLL_CHOICES)[number];

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';
const FROM = process.env.EMAIL_FROM || 'BrandOS <onboarding@resend.dev>';

// ---------------------------------------------------------------------------
// Poll tokens: "<signupId>.<hmac>" so a vote link can't be forged or pointed at
// someone else's signup. Keyed off INTERNAL_API_SECRET (set on staging + prod)
// with a purpose prefix, so the token is useless anywhere else.
// ---------------------------------------------------------------------------

function pollSig(signupId: string): string {
  const secret = process.env.INTERNAL_API_SECRET;
  if (!secret) throw new Error('INTERNAL_API_SECRET is not set');
  return createHmac('sha256', secret)
    .update(`pricing-poll:v1:${signupId}`)
    .digest('base64url')
    .slice(0, 32);
}

export function signPollToken(signupId: string): string {
  return `${signupId}.${pollSig(signupId)}`;
}

/** Returns the signup id for a valid token, else null. */
export function verifyPollToken(token: string): string | null {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const id = token.slice(0, dot);
  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(pollSig(id));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return id;
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

// Handles on older (March) signups were free text, so escape anything that
// goes into the email HTML.
const esc = (v: string) =>
  v.replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!
  );

export function reserveConfirmContent(r: {
  number: number;
  handle: string | null;
  archetype: string | null;
}): NewsletterContent {
  const no = String(r.number).padStart(4, '0');
  const name = r.archetype ? getArchetypeInfo(r.archetype)?.name : null;
  const sections: NewsletterContent['sections'] = [
    { type: 'stat', label: `#${no}`, content: 'your reserved brand station' },
    {
      type: 'text',
      content: `Your plot is claimed${r.handle ? ` for <b>@${esc(r.handle)}</b>` : ''}${
        name ? `, a <b>${esc(name)}</b> station` : ''
      }. It's locked: whatever station you reserved is the one you build when BrandOS Studio opens on <b>October 20</b>.`,
    },
  ];
  if (r.number <= 250) {
    sections.push({
      type: 'text',
      content: "You're in the first 250, so you have <b>founding priority</b>.",
    });
  }
  if (r.handle) {
    sections.push({
      type: 'cta',
      content: 'See your station',
      url: `${APP_URL}/station/${encodeURIComponent(r.handle)}`,
    });
  }
  sections.push({
    type: 'text',
    content: "We'll email you when the studio opens. Until then, keep building.",
  });
  return {
    subject: `Station #${no} is yours`,
    preheader: 'Your BrandOS brand station is reserved. The studio opens Oct 20.',
    sections,
  };
}

// DRAFT copy: Jeffrey approves the wording before the launch send.
export function launchEmailContent(signupId: string): NewsletterContent {
  const t = encodeURIComponent(signPollToken(signupId));
  const vote = (c: PollChoice) => `${APP_URL}/poll?t=${t}&c=${c}`;
  return {
    subject: 'BrandOS Studio opens Oct 20. Would you pay for it?',
    preheader: 'One click tells me what to build first.',
    sections: [
      {
        type: 'text',
        content:
          "Building brands shouldn't be difficult. So I've been building BrandOS Studio: find your taste, shape your brand, and stay on brand while you build in public.",
      },
      {
        type: 'text',
        content:
          'Today the free scan is live: drop your handle, get your brand score and your brand station, and reserve your plot. The studio opens <b>October 20</b>.',
      },
      { type: 'cta', content: 'Scan your brand', url: APP_URL },
      { type: 'divider', content: '' },
      { type: 'heading', content: 'One question: would you pay for it?' },
      { type: 'text', content: 'One click, no form. It tells me what to build first.' },
      { type: 'cta', content: 'Yes, Standard ($10/mo)', url: vote('standard') },
      { type: 'cta', content: 'Yes, Premium ($20/mo)', url: vote('premium') },
      { type: 'cta', content: 'Founding Member ($249 once)', url: vote('founding') },
      { type: 'cta', content: 'Not yet', url: vote('not-yet') },
      { type: 'text', content: 'Thanks for being early. Jeffrey' },
    ],
  };
}

// ---------------------------------------------------------------------------
// Sending
// ---------------------------------------------------------------------------

let resend: Resend | null = null;
function client(): Resend {
  if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
  resend ??= new Resend(process.env.RESEND_API_KEY);
  return resend;
}

export type SendResult = 'sent' | 'already-sent' | 'skipped-unsubscribed' | 'failed';

/**
 * Send `content` to a signup at most once per campaign. The EmailSend claim is
 * inserted first (unique key), so concurrent or repeated calls can't double
 * send. If Resend fails, the claim is released so a later run can retry.
 */
export async function sendOnce(
  signupId: string,
  campaign: string,
  build: (signup: { id: string; email: string }) => NewsletterContent
): Promise<SendResult> {
  const signup = await prisma.emailSignup.findUnique({
    where: { id: signupId },
    select: { id: true, email: true, unsubscribed: true },
  });
  if (!signup || signup.unsubscribed) return 'skipped-unsubscribed';

  try {
    await prisma.emailSend.create({ data: { emailSignupId: signup.id, campaign } });
  } catch (e) {
    if ((e as { code?: string }).code === 'P2002') return 'already-sent';
    throw e;
  }

  const content = build(signup);
  const { html, text } = renderNewsletter(content, signup.email);
  const { data, error } = await client().emails.send({
    from: FROM,
    to: signup.email,
    subject: content.subject,
    html,
    text,
    headers: {
      'List-Unsubscribe': `<${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(signup.email)}>`,
    },
  });
  if (error || !data) {
    await prisma.emailSend
      .delete({ where: { emailSignupId_campaign: { emailSignupId: signup.id, campaign } } })
      .catch(() => {});
    console.error(`[launch-emails] ${campaign} send failed`, error);
    return 'failed';
  }
  await prisma.emailSend.update({
    where: { emailSignupId_campaign: { emailSignupId: signup.id, campaign } },
    data: { resendId: data.id },
  });
  return 'sent';
}

/** Instant confirmation after a reservation; once per address, ever. */
export async function sendReserveConfirmation(signupId: string): Promise<SendResult> {
  const row = await prisma.emailSignup.findUnique({
    where: { id: signupId },
    select: { reservationNumber: true, xUsername: true, reservedArchetype: true },
  });
  if (row?.reservationNumber == null) return 'failed';
  return sendOnce(signupId, CAMPAIGNS.reserveConfirm, () =>
    reserveConfirmContent({
      number: row.reservationNumber!,
      handle: row.xUsername,
      archetype: row.reservedArchetype,
    })
  );
}
