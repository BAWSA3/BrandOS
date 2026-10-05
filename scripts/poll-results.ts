/**
 * Tally the launch-email "would you pay?" poll. Read-only.
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/poll-results.ts
 */
import prisma from '@/lib/db';
import { CAMPAIGNS, POLL_CHOICES } from '@/lib/launch-emails';

const PRICE: Record<string, number> = { standard: 10, premium: 20, founding: 249, 'not-yet': 0 };

async function main() {
  const sent = await prisma.emailSend.count({ where: { campaign: CAMPAIGNS.launch } });
  const groups = await prisma.pricingPollVote.groupBy({
    by: ['choice'],
    where: { campaign: CAMPAIGNS.launch },
    _count: { _all: true },
  });
  const counts = Object.fromEntries(groups.map((g) => [g.choice, g._count._all]));
  const votes = groups.reduce((n, g) => n + g._count._all, 0);
  console.log(
    `emails sent: ${sent}  |  votes: ${votes}  (${sent ? ((votes / sent) * 100).toFixed(1) : 0}% response)`
  );
  for (const c of POLL_CHOICES) {
    const n = counts[c] ?? 0;
    console.log(
      `  ${c.padEnd(8)} ${String(n).padStart(4)}  ${votes ? ((n / votes) * 100).toFixed(0) : 0}%`
    );
  }
  const intent =
    (counts.founding ?? 0) * PRICE.founding +
    ((counts.standard ?? 0) * PRICE.standard + (counts.premium ?? 0) * PRICE.premium) * 12;
  console.log(
    `stated intent if every yes converts: ~$${intent.toLocaleString()} (founding once + 12 mo of monthly)`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
