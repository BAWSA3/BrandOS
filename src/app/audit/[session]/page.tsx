/**
 * /audit/[session]
 *
 * Post-purchase audit page. Verifies Stripe session, runs audit,
 * renders results with downloadable MD file.
 *
 * Anonymous — no auth. Session ID in URL is the only gate.
 * If someone guesses/brute-forces a session ID, the /api/audit/run
 * endpoint still verifies payment_status === 'paid' via Stripe.
 */

import { notFound } from 'next/navigation';
import AuditResultsClient from './AuditResultsClient';

export default async function AuditPage({
  params,
}: {
  params: Promise<{ session: string }>;
}) {
  const { session } = await params;

  // Basic sanity check — Stripe session IDs start with cs_
  if (!session || !session.startsWith('cs_')) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <AuditResultsClient sessionId={session} />
    </div>
  );
}
