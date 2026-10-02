// ============================================================================
// webhook-idempotency — claim-first dedup for Stripe webhook events
//
// Pattern (docs/MINIMUM-LAUNCH-BAR.md Week 3):
//   1. claimWebhookEvent(id) BEFORE processing — the PK insert is the lock,
//      so concurrent duplicate deliveries can't both process.
//   2. If the handler then fails, releaseWebhookEvent(id) before returning
//      500 — Stripe's retry finds the claim gone and can reprocess.
//   3. purgeOldWebhookClaims() keeps 7 days (Stripe retries max ~3 days).
//
// Uses service-role Prisma — the webhook route has no user session (RLS on
// ProcessedWebhook has no policies; only service-role reaches it).
// ============================================================================

import prisma from '@/lib/db';
import { Prisma } from '@prisma/client';

const RETENTION_DAYS = 7;

/** True = first delivery, caller should process. False = replay, no-op. */
export async function claimWebhookEvent(eventId: string, eventType: string): Promise<boolean> {
  try {
    await prisma.processedWebhook.create({
      data: { id: eventId, eventType },
    });
    return true;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return false; // PK collision — already processed (or being processed)
    }
    throw error;
  }
}

/** Undo a claim so Stripe's retry can reprocess after a handler failure. */
export async function releaseWebhookEvent(eventId: string): Promise<void> {
  await prisma.processedWebhook
    .delete({ where: { id: eventId } })
    .catch(() => {}); // best-effort — a stuck claim just means a manual replay later
}

/** Drop claims past retention. Cheap; called opportunistically per delivery. */
export async function purgeOldWebhookClaims(): Promise<number> {
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000);
  const { count } = await prisma.processedWebhook.deleteMany({
    where: { processedAt: { lt: cutoff } },
  });
  return count;
}
