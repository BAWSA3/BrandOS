import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getActiveSubscribers } from '@/lib/newsletter';
import { renderNewsletter, NewsletterContent } from '@/lib/newsletter-template';

const FROM_EMAIL = process.env.EMAIL_FROM || 'BrandOS <hello@mybrandos.app>';

/**
 * POST /api/newsletter/send
 *
 * Send a broadcast newsletter to all active subscribers.
 * Protected by CRON_SECRET (same as other admin endpoints).
 *
 * Body: { subject, preheader?, sections[], dryRun? }
 */
export async function POST(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { subject, preheader, sections, dryRun = false } = body as {
      subject: string;
      preheader?: string;
      sections: NewsletterContent['sections'];
      dryRun?: boolean;
    };

    if (!subject || !sections?.length) {
      return NextResponse.json(
        { error: 'subject and sections are required' },
        { status: 400 }
      );
    }

    const content: NewsletterContent = { subject, preheader, sections };

    // Get active subscribers
    const subscribers = await getActiveSubscribers();

    if (dryRun) {
      const sample = renderNewsletter(content, 'preview@example.com');
      return NextResponse.json({
        dryRun: true,
        recipientCount: subscribers.length,
        subject,
        previewHtml: sample.html,
        previewText: sample.text,
      });
    }

    // Send via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'RESEND_API_KEY not configured' },
        { status: 500 }
      );
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Resend batch API supports up to 100 emails per call
    const BATCH_SIZE = 100;
    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);

      const emails = batch.map((sub) => {
        const { html, text } = renderNewsletter(content, sub.email);
        return {
          from: FROM_EMAIL,
          to: sub.email,
          subject,
          html,
          text,
        };
      });

      try {
        const result = await resend.batch.send(emails);
        if (result.error) {
          failed += batch.length;
          errors.push(`Batch ${Math.floor(i / BATCH_SIZE)}: ${result.error.message}`);
        } else {
          sent += batch.length;
        }
      } catch (err) {
        failed += batch.length;
        errors.push(`Batch ${Math.floor(i / BATCH_SIZE)}: ${String(err)}`);
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      failed,
      total: subscribers.length,
      ...(errors.length > 0 ? { errors } : {}),
    });
  } catch (error) {
    console.error('[Newsletter] Send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
