/**
 * Pre-launch tease: "BrandOS Studio opens Nov 2" to the whole list, each email
 * leading with that person's last brand score (when we have one) and a
 * one-tap rescan button.
 *
 * DRY RUN BY DEFAULT: prints the audience split and renders a sample of each
 * variant into PREVIEW_DIR (default: the OS temp dir). Nothing is sent without --send.
 *
 *   # preview (no sends)
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/send-studio-tease.ts
 *   # send to ONE address that is already on the list (test)
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/send-studio-tease.ts --send --to you@example.com
 *   # a first wave, then the rest (re-running skips everyone already sent)
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/send-studio-tease.ts --send --limit 150
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/send-studio-tease.ts --send
 *
 * Safe to re-run: EmailSend makes it once per address, unsubscribed rows are
 * skipped, failed sends release their claim. Paced under Resend's 2 req/s.
 */
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import prisma from '@/lib/db';
import { CAMPAIGNS, sendOnce, studioTeaseContent } from '@/lib/launch-emails';
import { renderNewsletter } from '@/lib/newsletter-template';

const args = process.argv.slice(2);
const SEND = args.includes('--send');
const to = args.includes('--to') ? args[args.indexOf('--to') + 1]?.toLowerCase() : undefined;
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : undefined;
const PREVIEW_DIR = process.env.PREVIEW_DIR || tmpdir();

const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;

/** March signups typed free text: "@foo", "x.com/foo", "https://twitter.com/foo?s=21". */
export function cleanHandle(raw: string | null): string | null {
  if (!raw) return null;
  let h = raw.trim();
  const url = h.match(/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})/i);
  if (url) h = url[1];
  h = h.replace(/^@/, '');
  return HANDLE_RE.test(h) ? h : null;
}

async function main() {
  const host = (process.env.DATABASE_URL ?? '').replace(/^.*@/, '').replace(/[:/].*$/, '');
  console.log(`DB host: ${host}  |  mode: ${SEND ? 'SEND' : 'dry run'}`);
  if (!process.env.EMAIL_REPLY_TO) {
    console.warn(
      '⚠ EMAIL_REPLY_TO is not set: replies go to the From address, which has no inbox.'
    );
    if (SEND && !to)
      throw new Error('Set EMAIL_REPLY_TO before a list send (the email asks for replies).');
  }

  const already = await prisma.emailSend.findMany({
    where: { campaign: CAMPAIGNS.studioTease },
    select: { emailSignupId: true },
  });
  const sentIds = new Set(already.map((r) => r.emailSignupId));

  const rows = await prisma.emailSignup.findMany({
    where: { NOT: { unsubscribed: true }, ...(to ? { email: to } : {}) },
    select: { id: true, email: true, xUsername: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  if (to && rows.length === 0) throw new Error(`${to} is not on the list (or is unsubscribed)`);

  // Latest stored score per handle (BrandScans is the homepage scan history).
  const scans = await prisma.$queryRaw<{ h: string; score: number; at: Date }[]>`
    select distinct on (lower(username)) lower(username) as h, score, created_at as at
    from "BrandScans" where score is not null
    order by lower(username), created_at desc`;
  const latest = new Map(scans.map((s) => [s.h, s]));

  const audience = rows.map((r) => {
    const handle = cleanHandle(r.xUsername);
    const scan = handle ? latest.get(handle.toLowerCase()) : undefined;
    return {
      ...r,
      handle,
      score: scan ? Math.round(scan.score) : null,
      since: scan?.at ?? r.createdAt,
    };
  });
  const pending = audience.filter((r) => !sentIds.has(r.id)).slice(0, limit ?? undefined);

  const withScore = audience.filter((a) => a.score != null).length;
  const withHandle = audience.filter((a) => a.handle).length;
  console.log(
    `list: ${rows.length} subscribed | with score: ${withScore} | handle only: ${withHandle - withScore} | no usable handle: ${rows.length - withHandle}`
  );
  console.log(`already sent: ${sentIds.size}  |  this run: ${pending.length}`);

  for (const [name, sample] of [
    ['score', audience.find((a) => a.score != null)],
    ['handle', audience.find((a) => a.handle && a.score == null)],
    ['none', audience.find((a) => !a.handle)],
  ] as const) {
    if (!sample) continue;
    const content = studioTeaseContent(sample);
    const file = join(PREVIEW_DIR, `studio-tease-${name}.html`);
    writeFileSync(file, renderNewsletter(content, sample.email).html);
    console.log(`sample [${name}] "${content.subject}" → ${file}`);
  }

  if (!SEND) {
    console.log('dry run: nothing sent. Add --send to send.');
    return;
  }

  const tally: Record<string, number> = {};
  for (const [i, r] of pending.entries()) {
    const res = await sendOnce(r.id, CAMPAIGNS.studioTease, () => studioTeaseContent(r));
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
