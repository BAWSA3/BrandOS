import { NextRequest, NextResponse } from 'next/server';
import { processPendingEmails, getPendingEmailsCount } from '@/lib/email';

/**
 * Cron job endpoint to process scheduled emails
 *
 * This endpoint should be called periodically (e.g., every hour) by Vercel Cron
 * or an external cron service to send emails that are due.
 *
 * Security: In production, validate the cron secret to prevent unauthorized access
 */
export async function GET(request: NextRequest) {
  try {
    // Optional: Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get pending count before processing
    const pendingBefore = await getPendingEmailsCount();

    // Process pending emails
    const result = await processPendingEmails();

    // Get pending count after processing
    const pendingAfter = await getPendingEmailsCount();

    console.log('[Cron] Email processing complete:', {
      pendingBefore,
      ...result,
      pendingAfter,
    });

    return NextResponse.json({
      success: true,
      pendingBefore,
      processed: result.processed,
      sent: result.sent,
      failed: result.failed,
      pendingAfter,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[Cron] Error processing emails:', error);
    return NextResponse.json(
      { error: 'Failed to process emails' },
      { status: 500 }
    );
  }
}

// Also support POST for manual triggering
export async function POST(request: NextRequest) {
  return GET(request);
}
