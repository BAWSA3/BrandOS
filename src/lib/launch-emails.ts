import { Resend } from 'resend';
import prisma from '@/lib/db';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import { renderNewsletter, type NewsletterContent } from '@/lib/newsletter-template';

/**
 * Lifecycle email: the instant "your station is reserved" confirmation and the
 * release-day "BrandOS is open, your first 30 days are free" email. No fixed
 * launch date (plan changed 2026-10-06: build the full product, then 30 days
 * free for every signup, then subscriptions). Server-only.
 *
 * Every send goes through sendOnce(): it claims an EmailSend row
 * (unique per signup + campaign) BEFORE calling Resend, so each address gets a
 * campaign at most once. That's what stops the public reserve form being used
 * to spam someone, and it makes the send script safe to re-run.
 */

export const CAMPAIGNS = {
  reserveConfirm: 'reserve-confirm',
  release: 'release-v1',
} as const;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';
const FROM = process.env.EMAIL_FROM || 'BrandOS <onboarding@resend.dev>';

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
      }. It's locked: whatever station you reserved is the one you build when BrandOS Studio opens.`,
    },
  ];
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
    preheader: 'Your BrandOS brand station is reserved. The studio is opening soon.',
    sections,
  };
}

// DRAFT copy for release day: Jeffrey approves the wording before any send.
export function releaseEmailContent(): NewsletterContent {
  return {
    subject: 'BrandOS is open. Your first 30 days are free.',
    preheader: 'Build your brand station, free for 30 days.',
    sections: [
      {
        type: 'text',
        content:
          "Building brands shouldn't be difficult. So I built BrandOS Studio: find your taste, shape your brand, and stay on brand while you build in public.",
      },
      {
        type: 'text',
        content:
          "It's open now, and your first <b>30 days are free</b>. Start on an empty plot and build your brand station as you go.",
      },
      { type: 'cta', content: 'Open BrandOS', url: APP_URL },
      {
        type: 'text',
        content:
          "I'm building this in public, so reply and tell me what you'd change. Every reply gets read. Jeffrey",
      },
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
