/**
 * Launch email (Nov 2): "@handle, No. 0137 is yours. no code needed", to
 * everyone whose reserved number (migration 045) is still unclaimed and who
 * doesn't have an account yet (members already in get a DM from Bawsa instead).
 *
 * A real send refuses to start unless sign-up is open: INVITE_ONLY off and
 * INDEX_ENABLED "true" in the env it runs with (pull prod's env first), and
 * /index/join answering 200 signed out on APP_URL. "no code needed" has to be true.
 *
 * DRY RUN BY DEFAULT: prints the audience and renders a sample into
 * PREVIEW_DIR (default: the OS temp dir). Nothing is sent without --send.
 *
 *   # preview (no sends)
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/send-index-reserved.ts
 *   # one test to an address that's on the list (outside the real campaign)
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/send-index-reserved.ts --send --test --to you@example.com
 *   # a first wave, then the rest (re-running skips everyone already sent)
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/send-index-reserved.ts --send --limit 150
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/send-index-reserved.ts --send
 *   # afterwards: how many claimed after their email
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/send-index-reserved.ts --report
 *
 * Safe to re-run: sendOnce() sends each address once per campaign, unsubscribed
 * rows are skipped, failed sends release their claim. Paced under Resend's 2 req/s.
 */
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import prisma from '@/lib/db';
import { inviteOnly } from '@/lib/early-access';
import { indexEnabled } from '@/lib/index-rules';
import {
  CAMPAIGNS,
  indexReservedContent,
  readArchetype,
  renderIndexReservedEmail,
  sendOnce,
} from '@/lib/launch-emails';

const args = process.argv.slice(2);
const SEND = args.includes('--send');
const TEST = args.includes('--test');
const REPORT = args.includes('--report');
const to = args.includes('--to') ? args[args.indexOf('--to') + 1]?.toLowerCase() : undefined;
const limit = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : undefined;
const PREVIEW_DIR = process.env.PREVIEW_DIR || tmpdir();
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';

/** The email says "no code needed": stop a list send while that isn't true. */
async function assertSignupOpen() {
  if (inviteOnly()) throw new Error('INVITE_ONLY is on: turn it off on prod before the send.');
  if (!indexEnabled()) throw new Error('INDEX_ENABLED is not "true": the Index is closed.');
  const res = await fetch(`${APP_URL}/index/join`, { redirect: 'manual' });
  if (res.status !== 200)
    throw new Error(`${APP_URL}/index/join answered ${res.status} signed out (want 200).`);
}

async function main() {
  const host = (process.env.DATABASE_URL ?? '').replace(/^.*@/, '').replace(/[:/].*$/, '');
  console.log(`DB host: ${host}  |  mode: ${SEND ? 'SEND' : REPORT ? 'report' : 'dry run'}`);
  if (!process.env.EMAIL_REPLY_TO && SEND && !to)
    throw new Error('Set EMAIL_REPLY_TO before a list send (people reply to these).');
  if (SEND && !TEST) await assertSignupOpen();

  const reservations = await prisma.indexReservation.findMany({
    where: { NOT: { emailSignupId: null } },
    select: { handle: true, number: true, emailSignupId: true, claimedAt: true },
    orderBy: { number: 'asc' },
  });
  const signups = await prisma.emailSignup.findMany({
    where: {
      id: { in: reservations.map((r) => r.emailSignupId!) },
      NOT: { unsubscribed: true },
      ...(to ? { email: to } : {}),
    },
    select: { id: true, email: true },
  });
  const emailOf = new Map(signups.map((s) => [s.id, s.email]));

  if (REPORT) {
    const sends = await prisma.emailSend.findMany({
      where: { campaign: CAMPAIGNS.indexReserved },
      select: { emailSignupId: true, sentAt: true },
    });
    const sentAt = new Map(sends.map((s) => [s.emailSignupId, s.sentAt]));
    const sent = reservations.filter((r) => sentAt.has(r.emailSignupId!));
    const claimed = sent.filter((r) => r.claimedAt && r.claimedAt > sentAt.get(r.emailSignupId!)!);
    console.log(
      `sent: ${sent.length} | claimed after their email: ${claimed.length} (${sent.length ? ((claimed.length / sent.length) * 100).toFixed(1) : '0'}%)`
    );
    return;
  }

  // Their latest public scan, for the "your read" line (676 of ~1,000 have one).
  const handles = reservations.map((r) => r.handle);
  const scans = await prisma.$queryRaw<
    { handle: string; score: number; archetype: string | null }[]
  >`
    select distinct on (lower(username)) lower(username) as handle, score, archetype
    from "BrandScans" where lower(username) = any(${handles})
    order by lower(username), created_at desc`;
  const readOf = new Map(
    scans.flatMap((s) => {
      const archetype = readArchetype(s.archetype);
      return archetype && s.score > 0 ? [[s.handle, { score: s.score, archetype }] as const] : [];
    })
  );

  // Already a member (signed in with this email or this X handle, or in the
  // Index): they don't get "no code needed". That covers repliers who used their code.
  const members = await prisma.user.findMany({
    where: {
      OR: [
        { email: { in: signups.map((s) => s.email), mode: 'insensitive' } },
        { xUsername: { in: handles, mode: 'insensitive' } },
      ],
    },
    select: { email: true, xUsername: true },
  });
  const entries = await prisma.indexEntry.findMany({
    where: { handle: { in: handles } },
    select: { handle: true },
  });
  const memberEmails = new Set(members.flatMap((u) => (u.email ? [u.email.toLowerCase()] : [])));
  const memberHandles = new Set([
    ...members.flatMap((u) => (u.xUsername ? [u.xUsername.toLowerCase()] : [])),
    ...entries.map((e) => e.handle),
  ]);

  // The opening line follows the Oct 27 early access email: got it, replied
  // and was sent a code (label "@handle") they haven't used, or never got it.
  const earlySends = await prisma.emailSend.findMany({
    where: { campaign: CAMPAIGNS.earlyAccess },
    select: { emailSignupId: true },
  });
  const gotEarly = new Set(earlySends.map((s) => s.emailSignupId));
  // Repliers' codes carry the Founding price; the Oct 30 list codes don't.
  const codes = await prisma.earlyAccessCode.findMany({
    where: { redeemedAt: null, revokedAt: null },
    select: { label: true, perkFoundingPrice: true },
  });
  const bareLabel = (l: string) => l.replace(/^@/, '').trim().toLowerCase();
  const sentCode = new Set(codes.filter((c) => c.perkFoundingPrice).map((c) => bareLabel(c.label)));
  const listCode = new Set(
    codes.filter((c) => !c.perkFoundingPrice).map((c) => bareLabel(c.label))
  );

  const audience = reservations
    .filter(
      (r) =>
        !r.claimedAt &&
        emailOf.has(r.emailSignupId!) &&
        !memberHandles.has(r.handle) &&
        !memberEmails.has(emailOf.get(r.emailSignupId!)!.toLowerCase())
    )
    .map((r) => ({
      id: r.emailSignupId!,
      email: emailOf.get(r.emailSignupId!)!,
      handle: r.handle,
      number: r.number,
      read: readOf.get(r.handle) ?? null,
      earlyAccess: (sentCode.has(r.handle)
        ? 'replied'
        : listCode.has(r.handle)
          ? 'code'
          : gotEarly.has(r.emailSignupId!)
            ? 'sent'
            : 'none') as 'sent' | 'replied' | 'code' | 'none',
      // Subject A/B split by number parity: stable across re-runs.
      variant: (r.number % 2 === 0 ? 'a' : 'b') as 'a' | 'b',
    }));
  console.log(
    `members left out: ${reservations.filter((r) => !r.claimedAt && emailOf.has(r.emailSignupId!)).length - audience.length} | with a brand read: ${audience.filter((a) => a.read).length} of ${audience.length} | opening sent/replied/code/none: ${['sent', 'replied', 'code', 'none'].map((k) => audience.filter((a) => a.earlyAccess === k).length).join('/')}`
  );
  if (to && audience.length === 0)
    throw new Error(`${to} has no unclaimed reservation (or isn't on the list)`);

  const sample = audience[0];
  if (sample) {
    const file = join(PREVIEW_DIR, 'index-reserved.html');
    writeFileSync(file, renderIndexReservedEmail(sample, sample.email).html);
    console.log(`sample "${indexReservedContent(sample).subject}" → ${file}`);
  }

  if (TEST) {
    if (!to || !SEND) throw new Error('--test needs --send --to <address on the list>');
    // Both subject lines, so the inbox shows A and B side by side.
    for (const variant of ['a', 'b'] as const) {
      const r = { ...audience[0], variant };
      const res = await sendOnce(
        r.id,
        `${CAMPAIGNS.indexReserved}:test-${variant}-${Date.now()}`,
        () => indexReservedContent(r),
        (_, email) => renderIndexReservedEmail(r, email)
      );
      console.log(`test ${variant.toUpperCase()} "${indexReservedContent(r).subject}" → ${res}`);
      await new Promise((ok) => setTimeout(ok, 600));
    }
    return;
  }

  const already = await prisma.emailSend.findMany({
    where: { campaign: CAMPAIGNS.indexReserved },
    select: { emailSignupId: true },
  });
  const sentIds = new Set(already.map((r) => r.emailSignupId));
  // No. 0000 is Bawsa: tests only, never the list send.
  const pending = audience
    .filter((r) => r.number !== 0 && !sentIds.has(r.id))
    .slice(0, limit ?? undefined);
  console.log(
    `reservations: ${reservations.length} | unclaimed with a subscribed email: ${audience.length} | already sent: ${sentIds.size} | this run: ${pending.length}`
  );
  if (!SEND) {
    console.log('dry run: nothing sent. Add --send to send.');
    return;
  }

  const tally: Record<string, number> = {};
  for (const [i, r] of pending.entries()) {
    // Claimed since the list was read (the send takes ~10 minutes): skip.
    const now = await prisma.indexReservation.findUnique({
      where: { handle: r.handle },
      select: { claimedAt: true },
    });
    if (now?.claimedAt) {
      tally.claimed = (tally.claimed ?? 0) + 1;
      continue;
    }
    const res = await sendOnce(
      r.id,
      CAMPAIGNS.indexReserved,
      () => indexReservedContent(r),
      (_, email) => renderIndexReservedEmail(r, email)
    );
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
