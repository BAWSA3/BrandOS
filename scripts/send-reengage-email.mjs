/**
 * Re-engagement email ("@handle, your brand station is waiting") for people on
 * the list who haven't reserved a station.
 *
 * DRY RUN BY DEFAULT: prints the audience size and writes one rendered sample
 * to /tmp/reengage-preview.html. Nothing is sent without a flag.
 *
 *   # preview (no sends)
 *   node --env-file=.env.prod.local scripts/send-reengage-email.mjs
 *   # TEST: send one copy to an address, directly (no list rows, no send tracking)
 *   node --env-file=.env.prod.local scripts/send-reengage-email.mjs --test you@example.com
 *   # the real send (optionally --limit N for a first wave). Needs BOTH flags.
 *   node --env-file=.env.prod.local scripts/send-reengage-email.mjs --send --i-am-sure [--limit 100]
 *
 * Real sends go through sendOnce(): each address gets the campaign at most once
 * (EmailSend), unsubscribed rows are skipped, and a failed send releases its
 * claim so a re-run retries it. Paced under Resend's 2 req/s default.
 */
import { createJiti } from 'jiti';
import path from 'node:path';
import fs from 'node:fs';

const jiti = createJiti(import.meta.url, { alias: { '@': path.resolve('src') } });
const { prisma } = await jiti.import('@/lib/db');
const { CAMPAIGNS, reengageContent, sendOnce } = await jiti.import('@/lib/launch-emails');
const { renderNewsletter } = await jiti.import('@/lib/newsletter-template');
const { Resend } = await import('resend');

const args = process.argv.slice(2);
const flag = (f) => args.includes(f);
const val = (f) => (flag(f) ? args[args.indexOf(f) + 1] : undefined);
const TEST = val('--test')?.toLowerCase();
const SEND = flag('--send') && flag('--i-am-sure');
const LIMIT = val('--limit') ? Number(val('--limit')) : undefined;
const FROM = process.env.EMAIL_FROM || 'BrandOS <onboarding@resend.dev>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';

const host = (process.env.DATABASE_URL ?? '').replace(/^.*@/, '').replace(/[:/].*$/, '');
console.log(`DB host: ${host} | mode: ${TEST ? `TEST → ${TEST}` : SEND ? 'SEND' : 'dry run'}`);

const claimed = await prisma.emailSignup.count({ where: { reservedAt: { not: null } } });

if (TEST) {
  // a real row's handle if this address is on the list, else a sample
  const row = await prisma.emailSignup.findUnique({
    where: { email: TEST },
    select: { xUsername: true },
  });
  const content = reengageContent({ handle: row?.xUsername ?? 'jbawsa', claimed });
  const { html, text } = renderNewsletter(content, TEST);
  const resend = new Resend(process.env.RESEND_API_KEY);
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: TEST,
    subject: `[TEST] ${content.subject}`,
    html,
    text,
    headers: {
      'List-Unsubscribe': `<${APP_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(TEST)}>`,
    },
  });
  console.log(
    error
      ? `✗ test failed: ${error.message}`
      : `✓ test sent (${data?.id}) — subject: "[TEST] ${content.subject}"`
  );
  await prisma.$disconnect();
  process.exit(error ? 1 : 0);
}

const already = new Set(
  (
    await prisma.emailSend.findMany({
      where: { campaign: CAMPAIGNS.reengage },
      select: { emailSignupId: true },
    })
  ).map((r) => r.emailSignupId)
);
const audience = (
  await prisma.emailSignup.findMany({
    where: { reservedAt: null, NOT: { unsubscribed: true } },
    select: { id: true, email: true, xUsername: true },
    orderBy: { createdAt: 'asc' },
  })
).filter((r) => !already.has(r.id) && !/^(test|cli-test)/.test(r.email));

console.log(
  `audience: ${audience.length} not yet reserved (${already.size} already sent, ${claimed} stations claimed)`
);
const sample = reengageContent({ handle: audience[0]?.xUsername ?? 'jbawsa', claimed });
fs.writeFileSync(
  '/tmp/reengage-preview.html',
  renderNewsletter(sample, 'preview@example.com').html
);
console.log(`subject: "${sample.subject}" | preview: /tmp/reengage-preview.html`);

if (!SEND) {
  if (flag('--send')) console.log('refusing: the real send needs --send --i-am-sure');
  await prisma.$disconnect();
  process.exit(0);
}

const batch = LIMIT ? audience.slice(0, LIMIT) : audience;
let sent = 0;
let failed = 0;
for (const r of batch) {
  const result = await sendOnce(r.id, CAMPAIGNS.reengage, () =>
    reengageContent({ handle: r.xUsername, claimed })
  );
  if (result === 'sent') sent++;
  if (result === 'failed') failed++;
  await new Promise((res) => setTimeout(res, 600));
}
console.log(`done: ${sent} sent, ${failed} failed, ${batch.length - sent - failed} skipped`);
await prisma.$disconnect();
