/**
 * Early access for the rest of the list (Oct 30): everyone subscribed who
 * isn't a member and hasn't been given a code gets their own single-use code
 * by email, no reply needed. Bawsa's KPI is trial users by Dec 3, so more
 * people start before the Nov 2 launch.
 *
 * These codes give access plus the tester line only: NO Founding price, NO
 * early Index (Bawsa, Oct 28). The label is "@handle" (or the email when the
 * signup has no usable handle), which is what the welcome email and the Nov 2
 * send read back.
 *
 * DRY RUN BY DEFAULT: prints the audience and renders samples into PREVIEW_DIR
 * (default: the OS temp dir). Creates no codes and sends nothing without --send.
 *
 *   # preview
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/send-early-access-codes.ts
 *   # a test to one address on the list (placeholder code, doesn't count as their send)
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/send-early-access-codes.ts --send --test --to you@example.com
 *   # a first wave, then the rest (re-running skips everyone already sent)
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/send-early-access-codes.ts --send --limit 100
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/send-early-access-codes.ts --send
 *
 * --exclude a,b,c leaves out more handles, e.g. people who replied "BrandOS"
 * but haven't been sent their (Founding) code yet, so they don't get a lesser one.
 *
 * Safe to re-run: a person's code is created once and reused, EmailSend makes
 * the email once per address, failed sends release their claim. Paced under
 * Resend's 2 req/s.
 */
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import prisma from '@/lib/db';
import { generateCode } from '@/lib/early-access-rules';
import {
  CAMPAIGNS,
  earlyAccessCodeContent,
  renderEarlyAccessCodeEmail,
  sendOnce,
} from '@/lib/launch-emails';

const args = process.argv.slice(2);
const SEND = args.includes('--send');
const TEST = args.includes('--test');
const arg = (name: string) =>
  args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : undefined;
const to = arg('to')?.toLowerCase();
const limit = arg('limit') ? Number(arg('limit')) : undefined;
const PREVIEW_DIR = process.env.PREVIEW_DIR || tmpdir();

// Replied but deliberately not given a code (Oct 28).
const EXCLUDE = new Set([
  'xnxx_en',
  ...(arg('exclude') ?? '')
    .split(',')
    .map((h) => h.trim().replace(/^@/, '').toLowerCase())
    .filter(Boolean),
]);

const HANDLE_RE = /^[A-Za-z0-9_]{1,15}$/;

/** Same as send-early-access.ts (not imported: importing a script runs its main()). */
function cleanHandle(raw: string | null): string | null {
  if (!raw) return null;
  let h = raw.trim();
  const url = h.match(/(?:x|twitter)\.com\/([A-Za-z0-9_]{1,15})/i);
  if (url) h = url[1];
  h = h.replace(/^@/, '');
  return HANDLE_RE.test(h) ? h : null;
}

const labelFor = (r: { handle: string | null; email: string }) =>
  r.handle ? `@${r.handle}` : r.email;
const keyOf = (label: string) => label.trim().replace(/^@/, '').toLowerCase();

/** This person's list code: the one made on an earlier run, or a new one. */
async function codeFor(label: string): Promise<string> {
  const existing = await prisma.earlyAccessCode.findFirst({
    where: { label, perkFoundingPrice: false, perkIndex: false, revokedAt: null },
    select: { code: true },
  });
  if (existing) return existing.code;
  for (;;) {
    const code = generateCode((n) => randomBytes(n));
    try {
      await prisma.earlyAccessCode.create({
        data: { code, label, perkIndex: false, perkFoundingPrice: false, perkTester: true },
      });
      return code;
    } catch (e) {
      if ((e as { code?: string }).code !== 'P2002') throw e; // collision: draw again
    }
  }
}

async function main() {
  const host = (process.env.DATABASE_URL ?? '').replace(/^.*@/, '').replace(/[:/].*$/, '');
  console.log(`DB host: ${host}  |  mode: ${SEND ? 'SEND' : 'dry run'}`);
  if (!process.env.EMAIL_REPLY_TO) {
    console.warn(
      '⚠ EMAIL_REPLY_TO is not set: replies go to the From address, which has no inbox.'
    );
    if (SEND) throw new Error('Set EMAIL_REPLY_TO before sending (the email invites replies).');
  }

  const rows = await prisma.emailSignup.findMany({
    where: { NOT: { unsubscribed: true }, ...(to ? { email: to } : {}) },
    select: { id: true, email: true, xUsername: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  if (to && rows.length === 0) throw new Error(`${to} is not on the list (or is unsubscribed)`);

  const list = rows
    .filter((r) => !/@example\.(com|org|net)$/i.test(r.email))
    .map((r) => ({ ...r, handle: cleanHandle(r.xUsername) }));
  const handles = list.flatMap((r) => (r.handle ? [r.handle.toLowerCase()] : []));

  // Already in: an account with this email or X handle.
  const members = await prisma.user.findMany({
    where: {
      OR: [
        { email: { in: list.map((r) => r.email), mode: 'insensitive' } },
        { xUsername: { in: handles, mode: 'insensitive' } },
      ],
    },
    select: { email: true, xUsername: true },
  });
  const memberKeys = new Set(
    members.flatMap((u) => [u.email?.toLowerCase(), u.xUsername?.toLowerCase()].filter(Boolean))
  );

  // Already given a code some other way (the repliers, any hand-made code).
  const codes = await prisma.earlyAccessCode.findMany({
    select: { label: true, perkFoundingPrice: true, perkIndex: true },
  });
  const otherCode = new Set(
    codes.filter((c) => c.perkFoundingPrice || c.perkIndex).map((c) => keyOf(c.label))
  );

  const already = await prisma.emailSend.findMany({
    where: { campaign: CAMPAIGNS.earlyAccessCodes },
    select: { emailSignupId: true },
  });
  const sentIds = new Set(already.map((r) => r.emailSignupId));

  const tally = { member: 0, coded: 0, excluded: 0 };
  const audience = list.filter((r) => {
    const keys = [r.email.toLowerCase(), r.handle?.toLowerCase()].filter(Boolean) as string[];
    const out = keys.some((k) => memberKeys.has(k))
      ? 'member'
      : keys.some((k) => otherCode.has(k))
        ? 'coded'
        : r.handle && EXCLUDE.has(r.handle.toLowerCase())
          ? 'excluded'
          : null;
    if (out) tally[out]++;
    return !out;
  });
  const withVariant = audience.map((r) => ({
    ...r,
    // stable across re-runs
    variant: (r.createdAt.getTime() % 2 === 0 ? 'a' : 'b') as 'a' | 'b',
  }));

  const pending = withVariant.filter((r) => !sentIds.has(r.id)).slice(0, limit ?? undefined);
  console.log(
    `list: ${rows.length} subscribed (${rows.length - list.length} test addresses dropped) | left out: ${tally.member} members, ${tally.coded} already have a code, ${tally.excluded} excluded`
  );
  console.log(
    `audience: ${audience.length} (${audience.filter((a) => !a.handle).length} without a handle) | already sent: ${sentIds.size} | this run: ${pending.length}`
  );

  const PLACEHOLDER = 'ABCD2345';
  for (const [name, sample] of [
    ['a', withVariant.find((a) => a.handle && a.variant === 'a')],
    ['b', withVariant.find((a) => a.variant === 'b')],
    ['no-handle', withVariant.find((a) => !a.handle)],
  ] as const) {
    if (!sample) continue;
    const r = { handle: sample.handle, code: PLACEHOLDER, variant: sample.variant };
    const file = join(PREVIEW_DIR, `early-access-codes-${name}.html`);
    writeFileSync(file, renderEarlyAccessCodeEmail(r, sample.email).html);
    console.log(`sample [${name}] "${earlyAccessCodeContent(r).subject}" → ${file}`);
  }

  if (TEST) {
    // One copy to one address, outside the real campaign and with a
    // placeholder code (no code is created), so they still get the real send.
    if (!to || !SEND) throw new Error('--test needs --send --to <address on the list>');
    const s = list[0];
    const r = { handle: s.handle, code: PLACEHOLDER, variant: 'a' as const };
    const res = await sendOnce(
      s.id,
      `${CAMPAIGNS.earlyAccessCodes}:test-${Date.now()}`,
      () => earlyAccessCodeContent(r),
      (_, email) => renderEarlyAccessCodeEmail(r, email)
    );
    console.log(`test "${earlyAccessCodeContent(r).subject}" → ${res} (placeholder code)`);
    return;
  }

  if (!SEND) {
    console.log('dry run: no codes created, nothing sent. Add --send to send.');
    return;
  }

  const sent: Record<string, number> = {};
  for (const [i, s] of pending.entries()) {
    const code = await codeFor(labelFor(s));
    const r = { handle: s.handle, code, variant: s.variant };
    const res = await sendOnce(
      s.id,
      CAMPAIGNS.earlyAccessCodes,
      () => earlyAccessCodeContent(r),
      (_, email) => renderEarlyAccessCodeEmail(r, email)
    );
    sent[res] = (sent[res] ?? 0) + 1;
    if ((i + 1) % 50 === 0) console.log(`  ${i + 1}/${pending.length}`, sent);
    await new Promise((ok) => setTimeout(ok, 600));
  }
  console.log('done:', sent);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
