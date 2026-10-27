/**
 * Early-access codes (migration 049): create, list, revoke.
 *
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/invite-codes.ts create --label "@aunnieonchain"
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/invite-codes.ts create --label "agency batch" --count 5
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/invite-codes.ts list
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/invite-codes.ts revoke AU7K-2QX9
 *
 * Optional flags on create: --no-index, --no-founding, --no-tester (turn a perk
 * off for that code) and --origin https://brandos-staging-five.vercel.app (the
 * link printed; default https://mybrandos.app).
 *
 * Refuses to run without an explicit env file (--env-file), and prints which
 * database it is writing to first. Codes are single use; the link carries the
 * code through sign-in (src/app/i/[code]/route.ts).
 */
import { randomBytes } from 'node:crypto';
import prisma from '@/lib/db';
import { formatCode, generateCode, inviteLink, normalizeCode } from '@/lib/early-access-rules';

const args = process.argv.slice(2);
const cmd = args[0];
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
const has = (name: string) => args.includes(`--${name}`);

function dbRef(): string {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? '';
  const user = url.match(/\/\/([^:@/]+)/)?.[1] ?? '';
  const host = url.replace(/^.*@/, '').replace(/[:/].*$/, '');
  // Supabase pooler users look like "postgres.<project-ref>"
  return `${user.includes('.') ? user.split('.')[1] : '?'} (${host})`;
}

async function create() {
  const label = flag('label')?.trim();
  if (!label) throw new Error('create needs --label "@handle" (who the code is for)');
  const count = Math.min(Math.max(Number(flag('count') ?? 1) || 1, 1), 100);
  const origin = flag('origin') ?? 'https://mybrandos.app';
  for (let made = 0; made < count; ) {
    const code = generateCode((n) => randomBytes(n));
    try {
      await prisma.earlyAccessCode.create({
        data: {
          code,
          label: count > 1 ? `${label} #${made + 1}` : label,
          perkIndex: !has('no-index'),
          perkFoundingPrice: !has('no-founding'),
          perkTester: !has('no-tester'),
        },
      });
      console.log(`${formatCode(code)}  ${inviteLink(code, origin)}  (${label})`);
      made++;
    } catch (e) {
      if ((e as { code?: string }).code !== 'P2002') throw e; // collision: draw again
    }
  }
}

async function list() {
  const codes = await prisma.earlyAccessCode.findMany({
    orderBy: { createdAt: 'desc' },
    include: { redeemedBy: { select: { xUsername: true } } },
  });
  const day = (d: Date | null) => (d ? d.toISOString().slice(0, 16).replace('T', ' ') : '');
  console.log(`${codes.length} codes, ${codes.filter((c) => c.redeemedAt).length} redeemed\n`);
  for (const c of codes) {
    const state = c.revokedAt
      ? `revoked ${day(c.revokedAt)}`
      : c.redeemedAt
        ? `redeemed by @${c.redeemedBy?.xUsername ?? '(deleted user)'} ${day(c.redeemedAt)}`
        : 'open';
    const perks = [
      c.perkIndex && 'index',
      c.perkFoundingPrice && 'founding',
      c.perkTester && 'tester',
    ]
      .filter(Boolean)
      .join('+');
    console.log(
      `${formatCode(c.code)}  ${c.label.padEnd(24)}  ${day(c.createdAt)}  ${perks}  ${state}`
    );
  }
}

async function revoke() {
  const code = normalizeCode(args[1]);
  if (!code) throw new Error('revoke needs a code, e.g. revoke AU7K-2QX9');
  const { count } = await prisma.earlyAccessCode.updateMany({
    where: { code, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  console.log(count ? `revoked ${formatCode(code)}` : `no open code ${formatCode(code)}`);
}

async function main() {
  if (!process.env.DIRECT_URL && !process.env.DATABASE_URL) {
    throw new Error('No database in env. Run with --env-file=<staging or prod env file>.');
  }
  console.log(`DB: ${dbRef()}\n`);
  if (cmd === 'create') return create();
  if (cmd === 'list') return list();
  if (cmd === 'revoke') return revoke();
  throw new Error(
    'usage: invite-codes.ts create --label "@handle" [--count n] | list | revoke <code>'
  );
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
