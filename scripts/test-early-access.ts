/**
 * Early-access codes (migration 049).
 *
 * Run:  npx tsx scripts/test-early-access.ts          (npm run test:early-access)
 *
 * A–D and F are pure (no network): code format, normalisation, generation, feedback
 * cleaning and redirect safety. E is the single-use race against a real
 * database and only runs with an env file whose DB has 049 applied:
 *   npx tsx --tsconfig tsconfig.json --env-file=<staging env> scripts/test-early-access.ts --db
 * It creates two throwaway codes and one throwaway user, races them, and
 * deletes everything it made.
 */
import { randomBytes } from 'node:crypto';
import {
  CODE_ALPHABET,
  CODE_LENGTH,
  CODE_TRIAL_DAYS,
  cleanApplication,
  cleanFeedback,
  codeTrialFrom,
  freeUntilFrom,
  memberFreeUntil,
  CODE_TRIAL_START,
  invitesLeft,
  joinHref,
  MEMBER_INVITES,
  FEEDBACK_MAX,
  formatCode,
  generateCode,
  inviteLink,
  inviteOnlyFrom,
  normalizeCode,
  signInGate,
  typedCodePath,
} from '../src/lib/early-access-rules';
import { safeNextPath } from '../src/lib/safe-input';

let passed = 0;
const failures: string[] = [];
function check(name: string, cond: boolean, detail = '') {
  if (cond) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failures.push(name);
    console.log(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

console.log('\nA. normalizeCode');
const ok: [string, string][] = [
  ['AU7K2QX9', 'AU7K2QX9'],
  ['au7k-2qx9', 'AU7K2QX9'],
  ['  AU7K 2QX9 ', 'AU7K2QX9'],
  ['au7k--2qx9', 'AU7K2QX9'],
];
for (const [input, want] of ok) check(`accepts "${input}"`, normalizeCode(input) === want);
const bad: unknown[] = [
  '',
  'AU7K2QX', // 7
  'AU7K2QX99', // 9
  'AU7K2QX0', // 0 isn't in the alphabet
  'AU7K2QXO', // O
  'AU7K2QX1', // 1
  'AU7K2QXI', // I
  'AU7K_2QX9',
  'AU7K2QX9;DROP',
  '../AU7K2QX9',
  'x'.repeat(200),
  null,
  42,
  { code: 'AU7K2QX9' },
];
for (const input of bad)
  check(`rejects ${JSON.stringify(input)?.slice(0, 30)}`, normalizeCode(input) === null);

console.log('\nB. generateCode / formatCode');
check('alphabet has 32 characters', CODE_ALPHABET.length === 32);
check('alphabet has no look-alikes', !/[01OI]/.test(CODE_ALPHABET));
const many = Array.from({ length: 2000 }, () => generateCode((n) => randomBytes(n)));
check(
  'every generated code is valid and canonical',
  many.every((c) => c.length === CODE_LENGTH && normalizeCode(c) === c)
);
check('2,000 codes are all different', new Set(many).size === many.length);
const seen = new Set(many.join(''));
check('generation uses the whole alphabet', seen.size === CODE_ALPHABET.length);
check('formatCode groups 4-4', formatCode('AU7K2QX9') === 'AU7K-2QX9');
check('formatted codes normalise back', normalizeCode(formatCode('AU7K2QX9')) === 'AU7K2QX9');
check(
  'invite link',
  inviteLink('AU7K2QX9') === 'https://mybrandos.app/i/AU7K-2QX9' &&
    inviteLink('AU7K2QX9', 'https://brandos-staging-five.vercel.app') ===
      'https://brandos-staging-five.vercel.app/i/AU7K-2QX9'
);

console.log('\nC. cleanFeedback');
check('empty → null', cleanFeedback('   \n ') === null);
check('non-string → null', cleanFeedback({ x: 1 }) === null);
check('keeps line breaks', cleanFeedback('a\r\nb') === 'a\nb');
check('drops control characters', cleanFeedback('a\u0000b\u0007c') === 'abc');
check('caps length', (cleanFeedback('x'.repeat(FEEDBACK_MAX + 50)) ?? '').length === FEEDBACK_MAX);

console.log('\nD. Redirect safety (invite results ride on the dashboard path)');
check(
  'keeps /dashboard?invite=ok',
  safeNextPath('/dashboard?invite=ok') === '/dashboard?invite=ok'
);
check(
  'an invite can’t smuggle an outside redirect',
  safeNextPath('//evil.example/?invite=ok') === '/dashboard' &&
    safeNextPath('/\\evil.example') === '/dashboard'
);

console.log('\nF. Invite-only sign-in gate (INVITE_ONLY)');
const g = (
  inviteOnly: boolean,
  existingAccount: boolean,
  code: 'none' | 'redeemable' | 'bad' | 'unavailable'
) => signInGate({ inviteOnly, existingAccount, code });
check('flag off: a new account signs up as today', g(false, false, 'none') === 'allow');
check('flag off: a bad carried code changes nothing', g(false, false, 'bad') === 'allow');
check('existing account signs in with no code', g(true, true, 'none') === 'allow');
check('existing account isn’t blocked by a bad code', g(true, true, 'bad') === 'allow');
check('new account without a code is turned away', g(true, false, 'none') === 'required');
check('new account with a valid code is admitted', g(true, false, 'redeemable') === 'admit');
check('new account with a used / revoked code: invalid', g(true, false, 'bad') === 'invalid');
check(
  'codes table missing (049 not applied): fails closed',
  g(true, false, 'unavailable') === 'required'
);
check(
  'INVITE_ONLY parsing: only "true" turns it on',
  inviteOnlyFrom('true') &&
    inviteOnlyFrom(' TRUE ') &&
    !inviteOnlyFrom(undefined) &&
    !inviteOnlyFrom('') &&
    !inviteOnlyFrom('false') &&
    !inviteOnlyFrom('1')
);
check('typed code goes to its invite link', typedCodePath(' au7k-2qx9 ') === '/i/AU7K-2QX9');
check('typed junk goes nowhere', typedCodePath('hello') === null && typedCodePath('') === null);
check(
  'typed code can’t inject a path',
  typedCodePath('../../admin') === null && typedCodePath('AU7K2QX9/../x') === null
);

console.log('\nG. Invite-only trial (Nov 2): 30 days, apply form, member invites');
{
  const t = new Date('2026-11-02T17:00:00Z');
  check('30 days', CODE_TRIAL_DAYS === 30);
  check(
    'free until = redeemed + 30 days',
    freeUntilFrom(t).toISOString() === '2026-12-02T17:00:00.000Z'
  );
  {
    const early = new Date('2026-10-01T00:00:00Z');
    const late = new Date('2026-11-05T00:00:00Z');
    const startEnd = '2026-12-02T08:00:00.000Z';
    check('start = Nov 2 midnight Pacific', CODE_TRIAL_START.toISOString() === '2026-11-02T08:00:00.000Z');
    check('early account, no code: 30 days from start', memberFreeUntil(null, early)?.toISOString() === startEnd);
    check('new account, no code: nothing', memberFreeUntil(null, late) === null);
    check('no account date, no code: nothing', memberFreeUntil(null, null) === null);
    check(
      'early account + later code: the later end wins',
      memberFreeUntil({ redeemedAt: new Date('2026-11-20T00:00:00Z'), revokedAt: null }, early)?.toISOString() ===
        '2026-12-20T00:00:00.000Z'
    );
    check(
      'early account + earlier code: start end wins',
      memberFreeUntil({ redeemedAt: new Date('2026-10-28T00:00:00Z'), revokedAt: null }, early)?.toISOString() === startEnd
    );
    check(
      'revoked code: nothing, even for an early account',
      memberFreeUntil({ redeemedAt: t, revokedAt: t }, early) === null
    );
  }
  check('flag: "true" on', codeTrialFrom('true') && codeTrialFrom(' TRUE '));
  check('flag: anything else off', !codeTrialFrom('1') && !codeTrialFrom(undefined) && !codeTrialFrom(''));
  check('join: trial on → /access', joinHref('/dashboard', true) === '/access?next=%2Fdashboard');
  check('join: trial off → /signup', joinHref('/dashboard', false) === '/signup?next=%2Fdashboard');
  check(
    'join: next is encoded',
    joinHref('/@jbawsa?compare=1', true) === '/access?next=%2F%40jbawsa%3Fcompare%3D1'
  );
  const a = cleanApplication({ handle: ' @JBawsa ', email: ' Me@Example.com ', note: ' hi\u0000 ' });
  check(
    'apply: handle + email cleaned',
    a?.handle === 'jbawsa' && a?.email === 'me@example.com' && a?.note === 'hi'
  );
  check(
    'apply: an x.com link becomes the handle',
    cleanApplication({ handle: 'https://x.com/jbawsa/status/1', email: 'a@b.co' })?.handle ===
      'jbawsa'
  );
  check('apply: bad handle rejected', !cleanApplication({ handle: 'no spaces', email: 'a@b.co' }));
  check('apply: long handle rejected', !cleanApplication({ handle: 'a'.repeat(16), email: 'a@b.co' }));
  check('apply: bad email rejected', !cleanApplication({ handle: 'ok', email: 'nope' }));
  check('apply: non-strings rejected', !cleanApplication({ handle: 1, email: {} }));
  check(
    'apply: note capped at 280',
    (cleanApplication({ handle: 'ok', email: 'a@b.co', note: 'x'.repeat(999) })?.note?.length ?? 0) ===
      280
  );
  check('apply: empty note → null', cleanApplication({ handle: 'ok', email: 'a@b.co', note: '  ' })?.note === null);
  check('invites: 3 each', MEMBER_INVITES === 3);
  check('invites: left counts down', invitesLeft(0) === 3 && invitesLeft(2) === 1);
  check('invites: never below zero', invitesLeft(5) === 0);
}

async function raceTest() {
  console.log('\nE. Single use against the database (--db)');
  const { default: prisma } = await import('../src/lib/db');
  const { redeemCode, earlyAccessFor } = await import('../src/lib/early-access');
  const stamp = Date.now().toString(36);
  const users = await Promise.all(
    [0, 1].map((i) =>
      prisma.user.create({ data: { supabaseId: `ea-test-${stamp}-${i}` }, select: { id: true } })
    )
  );
  const codes = [0, 1].map(() => generateCode((n) => randomBytes(n)));
  const gateCodes: string[] = [];
  const gateUsers: string[] = [];
  try {
    await prisma.earlyAccessCode.createMany({
      data: codes.map((code, i) => ({ code, label: `test ${stamp} ${i}` })),
    });
    // two people race for one code: exactly one wins
    const race = await Promise.all(users.map((u) => redeemCode(u.id, codes[0])));
    check('one code, two people at once: one wins', race.filter((r) => r.ok).length === 1);
    const winner = users[race.findIndex((r) => r.ok)];
    const loser = users.find((u) => u !== winner)!;
    check('the winner has early access', !!(await earlyAccessFor(winner.id)));
    check('the loser doesn’t', !(await earlyAccessFor(loser.id)));
    // a used code stays used
    check('a used code can’t be redeemed again', !(await redeemCode(loser.id, codes[0])).ok);
    // one person can't take two codes
    const second = await redeemCode(winner.id, codes[1]);
    check('a second code for the same person is left unused', second.ok && second.already);
    const left = await prisma.earlyAccessCode.findUnique({
      where: { code: codes[1] },
      select: { redeemedAt: true },
    });
    check('…and still open for someone else', !!left && !left.redeemedAt);
    // revoked codes don't redeem, and revoking removes access
    await prisma.earlyAccessCode.update({
      where: { code: codes[1] },
      data: { revokedAt: new Date() },
      select: { id: true },
    });
    check('a revoked code can’t be redeemed', !(await redeemCode(loser.id, codes[1])).ok);
    await prisma.earlyAccessCode.update({
      where: { code: codes[0] },
      data: { revokedAt: new Date() },
      select: { id: true },
    });
    check('revoking a redeemed code removes access', !(await earlyAccessFor(winner.id)));

    // the gated sign-up: account + code in one transaction
    const { createAccountWithCode, CodeTakenError } = await import('../src/lib/early-access');
    const gateCode = generateCode((n) => randomBytes(n));
    await prisma.earlyAccessCode.create({
      data: { code: gateCode, label: `test ${stamp} gate` },
      select: { id: true },
    });
    gateCodes.push(gateCode);
    const admitted = await createAccountWithCode(gateCode, (tx) =>
      tx.user.create({ data: { supabaseId: `ea-test-${stamp}-gate-1` }, select: { id: true } })
    );
    gateUsers.push(admitted.id);
    const used = await prisma.earlyAccessCode.findUnique({
      where: { code: gateCode },
      select: { redeemedByUserId: true },
    });
    check(
      'a valid code admits a new account and is used by it',
      used?.redeemedByUserId === admitted.id
    );
    let rejected = false;
    try {
      await createAccountWithCode(gateCode, (tx) =>
        tx.user.create({ data: { supabaseId: `ea-test-${stamp}-gate-2` }, select: { id: true } })
      );
    } catch (e) {
      rejected = e instanceof CodeTakenError;
    }
    const orphan = await prisma.user.findUnique({
      where: { supabaseId: `ea-test-${stamp}-gate-2` },
    });
    check('a used code is rejected and no account is left behind', rejected && !orphan);
  } finally {
    await prisma.earlyAccessCode.deleteMany({ where: { code: { in: [...codes, ...gateCodes] } } });
    await prisma.user.deleteMany({
      where: { id: { in: [...users.map((u) => u.id), ...gateUsers] } },
    });
    await prisma.$disconnect();
  }
}

(async () => {
  if (process.argv.includes('--db')) await raceTest();
  else console.log('\nE. Single use against the database: skipped (run with --db and an env file)');
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) process.exit(1);
})();
