/**
 * Input-guard acceptance suite (prod QA hardening, 2026-10-24).
 *
 * Run:  npx tsx scripts/test-input-guards.ts   (part of: npm run test:safety)
 *
 * Deterministic, no network. Covers the validators that stand between caller
 * input and a URL: the post-sign-in redirect (open redirect via `/\evil`) and
 * X handles that get spliced into SocialData / X API paths.
 */
import { safeNextPath, normalizeXHandle, handleInputValue } from '../src/lib/safe-input';
import { escapeHtml, isValidEmail, sanitizeDeep } from '../src/lib/email-safety';

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

console.log('\nA. safeNextPath (post-sign-in redirect)');
const keep: [string, string][] = [
  ['/dashboard', '/dashboard'],
  ['/pricing?plan=pro', '/pricing?plan=pro'],
  ['/@jbawsa', '/@jbawsa'],
  ['/index/join#top', '/index/join#top'],
];
for (const [input, want] of keep) {
  const got = safeNextPath(input);
  check(`keeps ${input}`, got === want, `got ${got}`);
}
const reject = [
  '/\\evil.example',
  '/\\/evil.example',
  '//evil.example',
  '///evil.example',
  'https://evil.example',
  'evil.example',
  '/%5Cevil.example/x', // stays a path: allowed only if it resolves same-origin
  '/\tevil',
  '/\nevil',
  '',
  null,
  undefined,
  '/' + 'a'.repeat(600),
];
for (const input of reject) {
  const got = safeNextPath(input as string | null | undefined);
  const sameOrigin = got.startsWith('/') && !got.startsWith('//') && !got.includes('\\');
  const label = JSON.stringify(input)?.slice(0, 40);
  if (input === '/%5Cevil.example/x') {
    check(`encoded backslash stays a local path (${label})`, sameOrigin, `got ${got}`);
  } else {
    check(`rejects ${label}`, got === '/dashboard', `got ${got}`);
  }
}
check('custom fallback', safeNextPath('//x', '/home') === '/home');
// The browser-side check: whatever comes back must resolve to our own origin.
for (const input of ['/\\evil.example', '//evil.example', '/ok']) {
  const resolved = new URL(safeNextPath(input), 'https://mybrandos.app');
  check(`resolves on-origin: ${input}`, resolved.origin === 'https://mybrandos.app');
}

console.log('\nB. normalizeXHandle (upstream URL paths)');
const handles: [unknown, string | null][] = [
  ['jbawsa', 'jbawsa'],
  ['@jbawsa', 'jbawsa'],
  ['  @JBawsa  ', 'JBawsa'],
  ['https://x.com/levelsio', 'levelsio'],
  ['twitter.com/levelsio?s=20', 'levelsio'],
  ['a_b_1', 'a_b_1'],
  ['../search?query=x', null],
  ['jbawsa/followers', null],
  ['jb awsa', null],
  ['jbawsa%2F..', null],
  ['abcdefghijklmnop', null], // 16 chars
  ['', null],
  ['@', null],
  [42, null],
  [null, null],
];
for (const [input, want] of handles) {
  const got = normalizeXHandle(input);
  check(`handle ${JSON.stringify(input)} → ${want}`, got === want, `got ${got}`);
}

console.log('\nB2. handleInputValue (what a handle input holds after a paste)');
const typed: [string, string][] = [
  ['https://x.com/naval', 'naval'],
  ['https://twitter.com/naval?s=20', 'naval'],
  ['x.com/naval/', 'naval'],
  ['@naval', 'naval'],
  ['nav', 'nav'], // mid-typing stays as typed
  ['https://x.com/', 'https://x.com/'], // partial URL: untouched until it has a handle
  ['bad name!', 'bad name!'], // invalid input is left for the form's error, not rewritten
];
for (const [input, want] of typed) {
  const got = handleInputValue(input);
  check(`input ${JSON.stringify(input)} → ${JSON.stringify(want)}`, got === want, `got ${got}`);
}

console.log('\nC. email-safety (public forms that send mail)');
check('valid email', isValidEmail('a.b+c@example.co'));
check('rejects markup in email', !isValidEmail('<a>@x.com'));
check('rejects missing tld', !isValidEmail('a@b'));
check('rejects non-string', !isValidEmail(123));
check(
  'escapes markup',
  escapeHtml('<a href="x">hi</a>') === '&lt;a href=&quot;x&quot;&gt;hi&lt;/a&gt;'
);
const deep = sanitizeDeep({
  displayName: '<img src=x onerror=1>',
  list: ['<b>', 'ok'],
  nested: { a: { b: { c: { d: { e: 'too deep' } } } } },
  score: Infinity,
});
check('deep-escapes strings', deep.displayName === '&lt;img src=x onerror=1&gt;');
check('deep-escapes arrays', deep.list[0] === '&lt;b&gt;');
check('caps depth', JSON.stringify(deep.nested).includes('too deep') === false);
check('non-finite numbers → 0', deep.score === 0);
check(
  'caps long strings',
  (sanitizeDeep({ s: 'x'.repeat(5000) }) as { s: string }).s.length === 600
);

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log('FAILED:\n - ' + failures.join('\n - '));
  process.exit(1);
}
