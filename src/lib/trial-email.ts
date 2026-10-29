import { Resend } from 'resend';
import prisma from '@/lib/db';
import { renderNewsletter, type NewsletterContent } from '@/lib/newsletter-template';
import { foundingNumber } from '@/lib/founding';

/**
 * "Here's what your dashboard says" — sent when Stripe fires
 * customer.subscription.trial_will_end (≈3 days before the first charge: the
 * end of a 7-day card trial, or of a code's 30 free days when a card was added
 * during them). Their real score + weakest phase, the charge date, and a
 * one-click way to cancel. Transactional: one per trial (Stripe sends the
 * event once; the webhook is idempotent).
 */

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';
const FROM = process.env.EMAIL_FROM || 'BrandOS <hello@mybrandos.app>';

const PHASES: [string, string][] = [
  ['define', 'Define'],
  ['check', 'Check'],
  ['generate', 'Generate'],
  ['scale', 'Scale'],
];

export async function sendTrialEndingEmail(
  userId: string,
  endsAt: Date
): Promise<'sent' | 'skipped' | 'failed'> {
  if (!process.env.RESEND_API_KEY) return 'skipped';
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, xUsername: true },
  });
  if (!user?.email) return 'skipped';

  const scan = await prisma.brandScan
    .findFirst({
      where: { userId, status: 'active' },
      orderBy: { scannedAt: 'desc' },
      select: { score: true, phaseScores: true },
    })
    .catch(() => null);

  const phases = (scan?.phaseScores ?? {}) as Record<string, number>;
  const weakest = PHASES.filter(([k]) => typeof phases[k] === 'number').sort(
    (a, b) => phases[a[0]] - phases[b[0]]
  )[0];
  const day = endsAt.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  // Founding 100: a card added during free access (from Nov 2, a code's own 30
  // days; checkout sets trial_end to their end), first charged on `endsAt`
  const founding = await foundingNumber(userId);

  const content: NewsletterContent = {
    subject: founding
      ? `Founding #${founding}: your $29 rate starts ${day}`
      : `Your BrandOS trial ends ${day}`,
    preheader: scan
      ? `Your brand score is ${scan.score}. Here's what your dashboard says.`
      : undefined,
    sections: [
      {
        type: 'heading',
        content: `Here's what your dashboard says${user.xUsername ? `, @${user.xUsername}` : ''}`,
      },
      ...(scan
        ? ([
            { type: 'stat', label: String(scan.score), content: 'Your brand score / 100' },
            ...(weakest
              ? [
                  {
                    type: 'text' as const,
                    content: `Your weakest phase is <strong>${weakest[1]}</strong> (${phases[weakest[0]]}). That's where the next points are. Your dashboard shows which posts helped and what to try next.`,
                  },
                ]
              : []),
          ] as NewsletterContent['sections'])
        : []),
      {
        type: 'text',
        content: founding
          ? `Free access ends <strong>${day}</strong>. As founding member #${founding}, you keep everything for $29/month, locked in for life: score history, every post analyzed, your Brand Pass, and BrandOS inside Claude and ChatGPT. Your recorded brand teardown is coming from me.`
          : `Your free trial ends <strong>${day}</strong>. After that it's $29/month and you keep everything: score history, every post analyzed, your Brand Pass, and BrandOS inside Claude and ChatGPT. If you're one of the first 100, $29 is locked in for good.`,
      },
      {
        type: 'cta',
        content: 'Open my dashboard',
        url: `${APP_URL}/dashboard?utm_source=trial_email`,
      },
      {
        type: 'text',
        content: `Not for you? Cancel before ${day} in <a href="${APP_URL}/pricing">billing</a> and you won't be charged. A one-line reply telling me why helps more than you'd think. — Bawsa`,
      },
    ],
  };

  const { html, text } = renderNewsletter(content, user.email);
  const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
    from: FROM,
    to: user.email,
    subject: content.subject,
    html,
    text,
  });
  if (error) {
    console.error('[trial-email] send failed', error);
    return 'failed';
  }
  return 'sent';
}
