/**
 * Launch-day email with the one-click "would you pay?" poll (Oct 8, 2026).
 *
 * DRY RUN BY DEFAULT: prints who would get it and renders one sample to
 * /tmp/launch-email-preview.html. Nothing is sent without --send.
 *
 *   # preview (no sends)
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/send-launch-email.ts
 *   # send to ONE address that is already on the list (test)
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/send-launch-email.ts --send --to you@example.com
 *   # the real send (optionally --limit N for a first wave)
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/send-launch-email.ts --send
 *
 * Safe to re-run: each address gets the campaign at most once (EmailSend),
 * unsubscribed rows are skipped, and a failed send releases its claim so the
 * next run retries it. Resend's default limit is 2 req/s, so sends are paced.
 */
import { writeFileSync } from 'fs';
import prisma from '@/lib/db';
import { CAMPAIGNS, launchEmailContent, sendOnce } from '@/lib/launch-emails';
import { renderNewsletter } from '@/lib/newsletter-template';

const args = process.argv.slice(2);
const SEND = args.includes('--send');
const to = args.includes('--to') ? args[args.indexOf('--to') + 1]?.toLowerCase() : undefined;
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : undefined;

async function main() {
  const host = (process.env.DATABASE_URL ?? '').replace(/^.*@/, '').replace(/[:/].*$/, '');
  console.log(`DB host: ${host}  |  mode: ${SEND ? 'SEND' : 'dry run'}`);

  const already = await prisma.emailSend.findMany({
    where: { campaign: CAMPAIGNS.launch },
    select: { emailSignupId: true },
  });
  const sentIds = new Set(already.map((r) => r.emailSignupId));

  const rows = await prisma.emailSignup.findMany({
    where: { NOT: { unsubscribed: true }, ...(to ? { email: to } : {}) },
    select: { id: true, email: true },
    orderBy: { createdAt: 'asc' },
  });
  if (to && rows.length === 0) throw new Error(`${to} is not on the list (or is unsubscribed)`);
  const pending = rows.filter((r) => !sentIds.has(r.id)).slice(0, limit ?? undefined);
  console.log(
    `list: ${rows.length} subscribed  |  already sent: ${sentIds.size}  |  this run: ${pending.length}`
  );

  if (pending[0]) {
    const sample = renderNewsletter(launchEmailContent(pending[0].id), pending[0].email);
    writeFileSync('/tmp/launch-email-preview.html', sample.html);
    console.log('sample rendered: /tmp/launch-email-preview.html');
  }
  if (!SEND) {
    console.log('dry run: nothing sent. Add --send to send.');
    return;
  }

  const tally: Record<string, number> = {};
  for (const [i, r] of pending.entries()) {
    const res = await sendOnce(r.id, CAMPAIGNS.launch, (s) => launchEmailContent(s.id));
    tally[res] = (tally[res] ?? 0) + 1;
    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${pending.length}`, tally);
    await new Promise((ok) => setTimeout(ok, 600));
  }
  console.log('done:', tally);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
