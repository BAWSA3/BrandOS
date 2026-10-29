import { marketingBlocked, unsubscribeHeaders, withMarketingFooter } from '@/lib/email-compliance';
import { Resend } from 'resend';
import prisma from '@/lib/db';
import { renderNewsletter, type NewsletterContent } from '@/lib/newsletter-template';
import type { LookupStats } from '@/lib/lookups';

/**
 * Monday "your brand was looked up N times this week" email. Counts only.
 * Sent at most once per user per week (LookupDigest claim, released if the
 * send fails), never to unsubscribed addresses, never when the count is 0.
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';
const FROM = process.env.EMAIL_FROM || 'BrandOS <hello@mybrandos.app>';

export function digestContent(
  handle: string,
  s: LookupStats,
  score: number | null
): NewsletterContent {
  const parts = [
    s.page ? `${s.page} on your public page` : null,
    s.mcp ? `${s.mcp} in Claude or ChatGPT` : null,
    s.compare ? `${s.compare} compared their brand to yours` : null,
  ].filter(Boolean);
  return {
    subject: `@${handle}, your brand was looked up ${s.total} time${s.total === 1 ? '' : 's'} this week`,
    preheader: parts.join(' · '),
    sections: [
      { type: 'stat', label: String(s.total), content: 'Brand lookups this week' },
      {
        type: 'text',
        content: `${parts.join(', ')}. People are checking your brand before they decide about you.`,
      },
      ...(score !== null
        ? [
            {
              type: 'text' as const,
              content: `What they see right now: a brand score of <strong>${score}</strong>. Your dashboard shows what's moving it and what to post next.`,
            },
          ]
        : []),
      {
        type: 'cta',
        content: 'Open my dashboard',
        url: `${APP_URL}/dashboard?utm_source=lookup_digest`,
      },
      {
        type: 'text',
        content: `Want more lookups? Share your page: <a href="${APP_URL}/@${handle}">mybrandos.app/@${handle}</a>`,
      },
    ],
  };
}

export async function sendLookupDigest(
  user: { id: string; email: string; handle: string },
  stats: LookupStats,
  week: Date
): Promise<'sent' | 'skipped' | 'already' | 'failed'> {
  if (!process.env.RESEND_API_KEY || stats.total === 0) return 'skipped';
  const blocked = marketingBlocked();
  if (blocked) {
    console.error(`[lookup-digest] not sent: ${blocked}`);
    return 'skipped';
  }
  const unsub = await prisma.emailSignup
    .findUnique({ where: { email: user.email.toLowerCase() }, select: { unsubscribed: true } })
    .catch(() => null);
  if (unsub?.unsubscribed) return 'skipped';

  try {
    await prisma.lookupDigest.create({ data: { userId: user.id, week } });
  } catch (e) {
    if ((e as { code?: string }).code === 'P2002') return 'already';
    return 'skipped'; // table not there yet
  }

  const scan = await prisma.brandScan
    .findFirst({
      where: { userId: user.id, status: 'active' },
      orderBy: { scannedAt: 'desc' },
      select: { score: true },
    })
    .catch(() => null);
  const content = digestContent(user.handle, stats, scan?.score ?? null);
  const rendered = renderNewsletter(content, user.email);
  const { html, text } = withMarketingFooter(rendered.html, rendered.text, user.email);
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: FROM,
    to: user.email,
    subject: content.subject,
    html,
    text,
    headers: unsubscribeHeaders(user.email),
  });
  if (error) {
    await prisma.lookupDigest
      .delete({ where: { userId_week: { userId: user.id, week } } })
      .catch(() => {});
    console.error('[lookup-digest] send failed', error);
    return 'failed';
  }
  return 'sent';
}
