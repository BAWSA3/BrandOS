/**
 * Early-access codes (migration 049): create, list, revoke; applications (051).
 *
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/invite-codes.ts create --label "@aunnieonchain"
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/invite-codes.ts create --label "agency batch" --count 5
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/invite-codes.ts list
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/invite-codes.ts revoke AU7K-2QX9
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/invite-codes.ts applicants [--all]
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/invite-codes.ts approve handle1 handle2 …
 *
 * applicants: the "apply for a code" list (migration 051), newest first,
 * waiting ones only unless --all. approve: mints one code per handle (label
 * "@handle", all perks unless --no-*), links it to the application and prints
 * each person's email + link, ready to send. Already-approved handles are
 * skipped, so a re-run never mints twice.
 *
 * Optional flags on create: --no-index, --no-founding, --no-tester (turn a perk
 * off for that code) and --origin https://brandos-staging-five.vercel.app (the
 * link printed; default https://mybrandos.app).
 *
 *   npx tsx --tsconfig tsconfig.json --env-file=<env> scripts/invite-codes.ts reserve-codes [--dry] [--out file.csv]
 *
 * reserve-codes (051): one code per unclaimed Index reservation whose holder
 * isn't a member yet. Sign-up is invite-only from Nov 2, so the Nov 2 Index
 * email carries this code; it's how the reserved spot is honored. One code per
 * person (Bawsa, Oct 28): an unused code already given to that handle (a
 * replier's code, or the Oct 30 list code) is reused, so it keeps its perks.
 * Only someone with no code gets a new one, with list-code perks (tester only:
 * no Founding price, no early Index). Idempotent: EarlyAccessCode."reservedHandle"
 * is UNIQUE, so a re-run only fills reservations without one and prints
 * every reservation's code (old and new). --out writes the same as CSV
 * (handle,number,email,code,link) for the Email session. --dry mints nothing.
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
        select: { id: true },
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
    // explicit columns: works before and after migration 051
    select: {
      code: true,
      label: true,
      createdAt: true,
      redeemedAt: true,
      revokedAt: true,
      perkIndex: true,
      perkFoundingPrice: true,
      perkTester: true,
      redeemedBy: { select: { xUsername: true } },
    },
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

async function applicants() {
  const rows = await prisma.accessApplication.findMany({
    where: has('all') ? {} : { approvedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { handle: true, email: true, note: true, createdAt: true, approvedAt: true },
  });
  console.log(`${rows.length} ${has('all') ? 'applications' : 'waiting'}\n`);
  for (const r of rows) {
    const when = r.createdAt.toISOString().slice(0, 16).replace('T', ' ');
    const state = r.approvedAt ? 'approved' : 'waiting';
    console.log(`@${r.handle.padEnd(16)} ${r.email.padEnd(32)} ${when}  ${state}`);
    if (r.note) console.log(`    "${r.note.replace(/\s+/g, ' ')}"`);
  }
}

async function approve() {
  const origin = flag('origin') ?? 'https://mybrandos.app';
  const handles = args
    .slice(1)
    .filter((a, i, all) => !a.startsWith('--') && !all[i - 1]?.startsWith('--origin'))
    .map((h) => h.replace(/^@/, '').trim().toLowerCase());
  if (!handles.length) throw new Error('approve needs handles, e.g. approve jbawsa somebody');
  for (const handle of handles) {
    const app = await prisma.accessApplication.findUnique({
      where: { handle },
      select: { id: true, email: true, approvedAt: true },
    });
    if (!app) {
      console.log(`@${handle}: no application`);
      continue;
    }
    if (app.approvedAt) {
      console.log(`@${handle}: already approved`);
      continue;
    }
    for (;;) {
      const code = generateCode((n) => randomBytes(n));
      try {
        await prisma.$transaction(async (tx) => {
          const made = await tx.earlyAccessCode.create({
            data: {
              code,
              label: `@${handle}`,
              perkIndex: !has('no-index'),
              perkFoundingPrice: !has('no-founding'),
              perkTester: !has('no-tester'),
            },
            select: { id: true },
          });
          const { count } = await tx.accessApplication.updateMany({
            where: { id: app.id, approvedAt: null },
            data: { approvedAt: new Date(), codeId: made.id },
          });
          if (count !== 1) throw new Error('approved meanwhile');
        });
        console.log(`@${handle.padEnd(16)} ${app.email.padEnd(32)} ${inviteLink(code, origin)}`);
        break;
      } catch (e) {
        if ((e as { code?: string }).code === 'P2002') continue; // code collision: draw again
        console.log(`@${handle}: ${e instanceof Error ? e.message : 'failed'}`);
        break;
      }
    }
  }
}

async function reserveCodes() {
  const origin = flag('origin') ?? 'https://mybrandos.app';
  const dry = has('dry');
  const reservations = await prisma.indexReservation.findMany({
    where: { claimedAt: null },
    select: { handle: true, number: true, emailSignupId: true },
    orderBy: { number: 'asc' },
  });
  const handles = reservations.map((r) => r.handle);
  // already a member (X handle on an account, or in the Index): no code needed
  const [users, entries, existing, signups] = await Promise.all([
    prisma.user.findMany({
      where: { xUsername: { in: handles, mode: 'insensitive' } },
      select: { xUsername: true },
    }),
    prisma.indexEntry.findMany({ where: { handle: { in: handles } }, select: { handle: true } }),
    prisma.earlyAccessCode.findMany({
      where: { reservedHandle: { in: handles } },
      select: { code: true, reservedHandle: true, redeemedAt: true, revokedAt: true },
    }),
    prisma.emailSignup.findMany({
      where: {
        id: { in: reservations.flatMap((r) => (r.emailSignupId ? [r.emailSignupId] : [])) },
      },
      select: { id: true, email: true },
    }),
  ]);
  const member = new Set([
    ...users.flatMap((u) => (u.xUsername ? [u.xUsername.toLowerCase()] : [])),
    ...entries.map((e) => e.handle),
  ]);
  const codeOf = new Map(existing.map((c) => [c.reservedHandle!, c]));
  // Unused codes already handed to a handle ("@handle"), a replier's first.
  const handed = await prisma.earlyAccessCode.findMany({
    where: { reservedHandle: null, redeemedAt: null, revokedAt: null, label: { startsWith: '@' } },
    select: { id: true, code: true, label: true, perkFoundingPrice: true },
    orderBy: { perkFoundingPrice: 'asc' }, // later wins: Founding codes over list codes
  });
  const handedTo = new Map(handed.map((c) => [c.label.slice(1).trim().toLowerCase(), c]));
  const emailOf = new Map(signups.map((s) => [s.id, s.email]));

  const rows: string[] = ['handle,number,email,code,link'];
  let minted = 0;
  let reused = 0;
  let skipped = 0;
  for (const r of reservations) {
    if (member.has(r.handle)) {
      skipped++;
      continue;
    }
    let code = codeOf.get(r.handle)?.code ?? null;
    const theirs = code ? undefined : handedTo.get(r.handle.toLowerCase());
    if (theirs) {
      if (dry) {
        code = theirs.code;
        reused++;
      } else {
        const { count } = await prisma.earlyAccessCode.updateMany({
          where: { id: theirs.id, reservedHandle: null, redeemedAt: null },
          data: { reservedHandle: r.handle },
        });
        if (count === 1) {
          code = theirs.code;
          reused++;
        }
      }
    }
    if (!code && !dry) {
      for (;;) {
        const fresh = generateCode((n) => randomBytes(n));
        try {
          await prisma.earlyAccessCode.create({
            data: {
              code: fresh,
              label: `@${r.handle}`,
              reservedHandle: r.handle,
              perkIndex: false,
              perkFoundingPrice: false,
              perkTester: true,
            },
            select: { id: true },
          });
          code = fresh;
          minted++;
          break;
        } catch (e) {
          if ((e as { code?: string }).code !== 'P2002') throw e;
          // a collision on the code (draw again), or another run took this
          // reservation (read it back)
          const taken = await prisma.earlyAccessCode.findUnique({
            where: { reservedHandle: r.handle },
            select: { code: true },
          });
          if (taken) {
            code = taken.code;
            break;
          }
        }
      }
    }
    const email = r.emailSignupId ? (emailOf.get(r.emailSignupId) ?? '') : '';
    rows.push(
      [
        r.handle,
        r.number,
        email,
        code ? formatCode(code) : '',
        code ? inviteLink(code, origin) : '',
      ]
        .map((v) => `${v}`.replace(/[",\n]/g, ' '))
        .join(',')
    );
  }
  const out = flag('out');
  if (out) {
    const { writeFileSync } = await import('node:fs');
    writeFileSync(out, rows.join('\n') + '\n', { mode: 0o600 });
    console.log(`wrote ${rows.length - 1} rows → ${out}`);
  } else {
    console.log(rows.join('\n'));
  }
  console.log(
    `\nunclaimed reservations: ${reservations.length} | already members (no code): ${skipped} | reused their code: ${reused} | minted now: ${minted}${dry ? ' (dry run: nothing written)' : ''}`
  );
}

async function main() {
  if (!process.env.DIRECT_URL && !process.env.DATABASE_URL) {
    throw new Error('No database in env. Run with --env-file=<staging or prod env file>.');
  }
  console.log(`DB: ${dbRef()}\n`);
  if (cmd === 'create') return create();
  if (cmd === 'list') return list();
  if (cmd === 'revoke') return revoke();
  if (cmd === 'applicants') return applicants();
  if (cmd === 'approve') return approve();
  if (cmd === 'reserve-codes') return reserveCodes();
  throw new Error(
    'usage: invite-codes.ts create --label "@handle" [--count n] | list | revoke <code> | applicants [--all] | approve <handle…> | reserve-codes [--dry] [--out f.csv]'
  );
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
