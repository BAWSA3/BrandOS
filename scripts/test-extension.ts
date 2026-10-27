/**
 * BrandOS for Chrome: the composer core (chrome-extension/content/core.js,
 * pure parts) and the scoped extension token (src/lib/extension-token.ts).
 * DOM parts (findComposers/readDraft/hasMedia/chipAnchor) run against X's
 * composer markup in chrome-extension/test/fixture.html in a browser.
 *   npm run test:extension
 */
import { createRequire } from 'module';

process.env.EXTENSION_TOKEN_SECRET = 'test-secret-for-extension-tokens-0123456789';
process.env.BRANDOS_CHROME_EXTENSION_ID = 'abcdefghijklmnopabcdefghijklmnop';

const require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-require-imports
const core = require('../chrome-extension/content/core.js');

let pass = 0;
let fail = 0;
function test(name: string, ok: boolean, detail?: unknown) {
  if (ok) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}`, detail ?? '');
  }
}

async function main() {
  const tok = await import('../src/lib/extension-token');

  console.log('\nA. Draft text');
  test('nbsp → space, trims', core.normalizeDraft(' hello world \n') === 'hello world');
  test('collapses 3+ blank lines', core.normalizeDraft('a\n\n\n\nb') === 'a\n\nb');
  test('counts emoji once', core.chars('🧵🧵') === 2);

  console.log('\nB. When to score');
  test('too short: no', !core.shouldScore('short one', false, null));
  test('long enough: yes', core.shouldScore('this is a real draft now', false, null));
  const key = core.draftKey('this is a real draft now', false);
  test('same draft again: no', !core.shouldScore('this is a real draft now ', false, key));
  test('media toggled: yes', core.shouldScore('this is a real draft now', true, key));
  test('edited: yes', core.shouldScore('this is a real draft now!', false, key));
  test('over 2,000: no', !core.shouldScore('x'.repeat(2001), false, null));

  console.log('\nC. Chip text');
  const scored = core.chipView({
    kind: 'scored',
    result: {
      score: 84,
      verdict: 'Ready to post',
      fixes: [{ text: 'Add an image: your posts with media engage 1.9× your text-only posts.' }],
    },
  });
  test('scored: the number', scored.label === '84' && scored.tone === 'good');
  test(
    'scored: top fix, truncated',
    scored.detail.length <= 46 && scored.detail.endsWith('…'),
    scored.detail
  );
  test(
    'low score tone',
    core.chipView({ kind: 'scored', result: { score: 41, verdict: 'Needs work', fixes: [] } })
      .tone === 'low'
  );
  test(
    'no fixes → verdict',
    core.chipView({ kind: 'scored', result: { score: 70, verdict: 'Close', fixes: [] } }).detail ===
      'Close'
  );
  test(
    'signed out asks to connect',
    core.chipView({ kind: 'signed-out' }).detail === 'Connect to score'
  );
  test(
    'reach line',
    core.reachLine({ low: 0.8, high: 1.3 }) === 'Likely 0.8–1.3× your usual views'
  );
  test('reach line, single', core.reachLine({ low: 1, high: 1 }) === 'Likely 1× your usual views');

  console.log('\nD. Extension token');
  const now = Date.now();
  const { token, expiresAt } = tok.mintExtensionToken('user-123', now);
  test('format bx1.payload.sig', /^bx1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token), token);
  test('verifies to the member', tok.verifyExtensionToken(token, now) === 'user-123');
  test('30-day expiry', expiresAt - now === 30 * 24 * 60 * 60 * 1000);
  test('expired → null', tok.verifyExtensionToken(token, expiresAt + 1) === null);
  const [p, payload, sig] = token.split('.');
  const forged = Buffer.from(
    JSON.stringify({ u: 'someone-else', s: 'draft-score', e: now + 1e9 })
  ).toString('base64url');
  test('swapped payload → null', tok.verifyExtensionToken(`${p}.${forged}.${sig}`, now) === null);
  test(
    'bad signature → null',
    tok.verifyExtensionToken(`${p}.${payload}.${sig.slice(0, -2)}AA`, now) === null
  );
  test('wrong prefix → null', tok.verifyExtensionToken(`bx2.${payload}.${sig}`, now) === null);
  test('not a string → null', tok.verifyExtensionToken(42, now) === null);
  test(
    'a Supabase-style JWT → null',
    tok.verifyExtensionToken('eyJhbGciOi.eyJzdWIiOi.c2ln', now) === null
  );
  process.env.EXTENSION_TOKEN_SECRET = 'a-different-secret-rotated-0123456789abcdef';
  test('rotated secret signs everyone out', tok.verifyExtensionToken(token, now) === null);

  console.log('\nE. CORS');
  const good = tok.extensionCors('chrome-extension://abcdefghijklmnopabcdefghijklmnop');
  test(
    'the published extension is allowed',
    good['Access-Control-Allow-Origin'] === 'chrome-extension://abcdefghijklmnopabcdefghijklmnop'
  );
  test(
    'another extension is not',
    !tok.extensionCors('chrome-extension://zzzz')['Access-Control-Allow-Origin']
  );
  test(
    'a website is not',
    !tok.extensionCors('https://evil.example')['Access-Control-Allow-Origin']
  );
  test('no origin is not', !tok.extensionCors(null)['Access-Control-Allow-Origin']);
  delete process.env.BRANDOS_CHROME_EXTENSION_ID;
  test(
    'dev (no id): any extension',
    !!tok.extensionCors('chrome-extension://zzzz')['Access-Control-Allow-Origin']
  );
  test(
    'dev (no id): still no website',
    !tok.extensionCors('https://evil.example')['Access-Control-Allow-Origin']
  );

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main();
