/**
 * Early-access codes (migration 049).
 *
 * Run:  npx tsx scripts/test-early-access.ts          (npm run test:early-access)
 *
 * A–D are pure (no network): code format, normalisation, generation, feedback
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
  cleanFeedback,
  FEEDBACK_MAX,
  formatCode,
  generateCode,
  inviteLink,
  normalizeCode,
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
    const left = await prisma.earlyAccessCode.findUnique({ where: { code: codes[1] } });
    check('…and still open for someone else', !!left && !left.redeemedAt);
    // revoked codes don't redeem, and revoking removes access
    await prisma.earlyAccessCode.update({
      where: { code: codes[1] },
      data: { revokedAt: new Date() },
    });
    check('a revoked code can’t be redeemed', !(await redeemCode(loser.id, codes[1])).ok);
    await prisma.earlyAccessCode.update({
      where: { code: codes[0] },
      data: { revokedAt: new Date() },
    });
    check('revoking a redeemed code removes access', !(await earlyAccessFor(winner.id)));
  } finally {
    await prisma.earlyAccessCode.deleteMany({ where: { code: { in: codes } } });
    await prisma.user.deleteMany({ where: { id: { in: users.map((u) => u.id) } } });
    await prisma.$disconnect();
  }
}

(async () => {
  if (process.argv.includes('--db')) await raceTest();
  else console.log('\nE. Single use against the database: skipped (run with --db and an env file)');
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) process.exit(1);
})();
