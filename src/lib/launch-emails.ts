import { Resend } from 'resend';
import prisma from '@/lib/db';
import { getArchetypeInfo } from '@/lib/archetype-descriptions';
import { normalizeArchetypeName } from '@/lib/archetype-names';
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
  reengage: 'reengage-oct26',
  studioTease: 'studio-tease-oct22',
} as const;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';
const FROM = process.env.EMAIL_FROM || 'BrandOS <onboarding@resend.dev>';
// mybrandos.app has no inbox (no MX), so replies need a real mailbox
const REPLY_TO = process.env.EMAIL_REPLY_TO || undefined;

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

/**
 * Re-engagement (Oct 2026): for people who scanned before stations existed and
 * never reserved one. Personal ("you scanned in march"), one action (rescan +
 * reserve), honest scarcity (live count of claimed stations), and owns the
 * unsubscribe bug fixed 2026-10-12.
 */
export function reengageContent(r: {
  handle: string | null;
  claimed: number;
}): NonNullable<NewsletterContent> {
  const who = r.handle ? `@${esc(r.handle)}` : 'there';
  return {
    subject: r.handle
      ? `@${r.handle}, your brand station is waiting`
      : 'your brand station is waiting',
    preheader: 'You scanned your brand in March. Since then we built something for it.',
    sections: [
      {
        type: 'text',
        content: `hey ${who},<br/><br/>back in march you scanned your X on BrandOS and got your brand score. thanks for being early.`,
      },
      {
        type: 'text',
        content:
          'since then we&#39;ve been building. every creator on BrandOS now gets a <b>brand station</b>: a 3D building that&#39;s yours, shaped by your archetype, and it grows as your brand does.',
      },
      { type: 'heading', content: "what's live now" },
      {
        type: 'text',
        content: `• <b>a fresh scan</b>: your score, your archetype, and what to fix next<br/>• <b>your station</b>: reserve your number before the good ones go (${r.claimed} claimed so far)<br/>• <b>your brand pass</b>: your identity card with archetype, taste, pillars and score`,
      },
      {
        type: 'text',
        content:
          'and coming next: <b>BrandOS dashboards</b>. track your score over time, see exactly which part of your brand to work on, and level up as you post. people with a reserved station get in first.',
      },
      { type: 'cta', content: 'Rescan + reserve your station →', url: APP_URL },
      { type: 'text', content: 'takes about a minute.<br/><br/>— Bawsa' },
      { type: 'divider', content: '' },
      {
        type: 'text',
        content:
          '<span style="color:#888;font-size:13px">p.s. if you ever tried to unsubscribe from our emails and it didn&#39;t work, that&#39;s on us. it&#39;s fixed now, and the link below works.</span>',
      },
    ],
  };
}

/** Current display name for a stored archetype ("SIGNAL_SAGE" → "SOURCE"), or null. */
function archetypeLabel(raw: string | null): string | null {
  if (!raw) return null;
  const name = normalizeArchetypeName(normalizeArchetypeName(raw).replace(/^The /, ''));
  const info = getArchetypeInfo(name);
  // "62 · NULL" reads like missing data, so the anon archetype stays off the label
  return info && info.name !== 'NULL' ? info.name : null;
}

/**
 * Pre-launch tease (Oct 22 2026) for the whole list: "BrandOS Studio opens
 * Nov 2". One job: get a fresh scan. Hook (their last score + archetype) →
 * button straight away (`/?scan=<handle>` runs their scan) → the why, the
 * Studio, a reply offer, Founding 100 in the P.S.
 *
 * Subject A/B on people with a score: A = "you scored 62 in march",
 * B = "did your brand score go up?". The variant rides utm_content, and
 * conversion is read back from BrandScans (did that handle scan after the send).
 */
export function studioTeaseContent(r: {
  handle: string | null;
  score: number | null;
  archetype?: string | null;
  since: Date;
  variant?: 'a' | 'b';
}): NonNullable<NewsletterContent> {
  const who = r.handle ? `@${esc(r.handle)}` : 'there';
  const month = r.since.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' }).toLowerCase();
  const days = (Date.now() - r.since.getTime()) / 86_400_000;
  // scanned in the last ~6 weeks: "7 months of posts ago" would read wrong
  const recent = days < 45;
  const months = Math.max(2, Math.round(days / 30));
  const variant = r.variant ?? 'a';
  const utm = `utm_source=email&utm_medium=email&utm_campaign=studio-tease&utm_content=${variant}`;
  const url = r.handle
    ? `${APP_URL}/?scan=${encodeURIComponent(r.handle)}&${utm}`
    : `${APP_URL}/?${utm}`;
  const arch = archetypeLabel(r.archetype ?? null);
  const hasScore = r.score != null;

  const hook: NewsletterContent['sections'] = hasScore
    ? [
        {
          type: 'stat',
          label: arch ? `${r.score} · ${esc(arch)}` : String(r.score),
          content: recent ? 'your brand, last scan' : `your brand in ${month}`,
        },
        {
          type: 'text',
          content: recent
            ? 'your score moves every time you post. up or down since your last scan? i&#39;d bet you can&#39;t guess which.'
            : `that was ${months} months of posts ago. your score has moved since, up or down, and i&#39;d bet you can&#39;t guess which.`,
        },
      ]
    : [
        {
          type: 'text',
          content: recent
            ? 'you signed up for BrandOS recently. before it opens, see where your brand stands. it&#39;s free and takes about a minute.'
            : `you signed up for BrandOS back in ${month}. i&#39;ve been building since. before it opens, see where your brand stands. it&#39;s free and takes about a minute.`,
        },
      ];

  const subject =
    hasScore && r.handle
      ? variant === 'b'
        ? `@${r.handle}, did your brand score go up?`
        : recent
          ? `@${r.handle}, your last brand score was ${r.score}`
          : `@${r.handle}, you scored ${r.score} in ${month}`
      : r.handle
        ? `@${r.handle}, what's your brand score now?`
        : "what's your brand score now?";

  return {
    subject,
    preheader: hasScore
      ? 'did it go up or down? takes a minute to find out.'
      : 'free, about a minute. BrandOS Studio opens Nov 2.',
    sections: [
      { type: 'text', content: `hey ${who},` },
      ...hook,
      { type: 'cta', content: hasScore ? 'See my score now →' : 'Scan my brand →', url },
      {
        type: 'text',
        content:
          '4,000+ creators have scanned their brand on BrandOS. brands are starting to ask AI who to work with instead of reading bios, so knowing where you stand matters more every month.',
      },
      {
        type: 'text',
        content:
          'on <b>nov 2</b> i&#39;m opening <b>BrandOS Studio</b>: it tracks your score over time and tells you what to fix after every post.',
      },
      {
        type: 'text',
        content:
          'hit reply with your new score and i&#39;ll tell you the one thing i&#39;d fix first.<br/><br/>— Bawsa',
      },
      {
        type: 'text',
        content:
          '<b>p.s.</b> the first 100 people to go Pro on nov 2 lock in $29/mo forever, plus a recorded teardown of their brand from me.',
      },
    ],
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
    ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
    subject: content.subject,
    html,
    text,
    headers: {
      'List-Unsubscribe': `<${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(signup.email)}>`,
      // RFC 8058 one-click: Gmail/Yahoo POST to the URL above (the route reads ?email=)
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
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
