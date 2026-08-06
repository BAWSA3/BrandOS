/**
 * Webhook-idempotency acceptance suite (Launch Bar Week 3).
 *
 * Run:  npm run test:webhooks   (uses .env.local → STAGING database)
 *
 * Exercises src/lib/webhook-idempotency.ts against the real ProcessedWebhook
 * table: first claim wins, replay no-ops, release re-opens (Stripe retry
 * path), retention purge drops old claims. Cleans up after itself.
 */
import { randomUUID } from 'crypto';
import prisma from '../src/lib/db';
import {
  claimWebhookEvent,
  releaseWebhookEvent,
  purgeOldWebhookClaims,
} from '../src/lib/webhook-idempotency';

let passed = 0;
let failed = 0;

function check(name: string, ok: boolean, detail?: string) {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

async function main() {
  const evtId = `evt_test_${randomUUID().slice(0, 12)}`;
  const oldEvtId = `evt_test_old_${randomUUID().slice(0, 12)}`;

  console.log('Webhook-idempotency acceptance suite\n');

  try {
    console.log('A. Claim semantics');
    check('first claim wins', await claimWebhookEvent(evtId, 'checkout.session.completed'));
    check('duplicate delivery no-ops', !(await claimWebhookEvent(evtId, 'checkout.session.completed')));
    check(
      'concurrent duplicates: exactly one wins',
      (
        await Promise.all(
          Array.from({ length: 5 }, () => claimWebhookEvent(`${evtId}_c`, 'invoice.paid')),
        )
      ).filter(Boolean).length === 1,
    );

    console.log('\nB. Failure path (Stripe retry)');
    await releaseWebhookEvent(evtId);
    check('release re-opens the claim', await claimWebhookEvent(evtId, 'checkout.session.completed'));
    await releaseWebhookEvent(`evt_never_claimed_${evtId}`); // must not throw
    check('releasing an unknown id is a no-op', true);

    console.log('\nC. Retention purge');
    await prisma.processedWebhook.create({
      data: {
        id: oldEvtId,
        eventType: 'invoice.paid',
        processedAt: new Date(Date.now() - 8 * 86_400_000), // 8 days old
      },
    });
    await purgeOldWebhookClaims();
    check(
      '8-day-old claim purged',
      !(await prisma.processedWebhook.findUnique({ where: { id: oldEvtId } })),
    );
    check(
      'fresh claim survives purge',
      !!(await prisma.processedWebhook.findUnique({ where: { id: evtId } })),
    );
  } finally {
    await prisma.processedWebhook
      .deleteMany({ where: { id: { in: [evtId, `${evtId}_c`, oldEvtId] } } })
      .catch(() => {});
    await prisma.$disconnect();
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
