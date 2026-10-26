/**
 * Past brand deals on a Creator Index entry (src/lib/index-deal-rules.ts,
 * migration 046).
 *   npm run test:index-deals
 * Pure checks only: validation and normalisation of what a member types.
 */
import { readFileSync } from 'fs';
import {
  BRAND_MAX,
  cleanHandle,
  cleanPostUrl,
  MAX_DEALS,
  monthOf,
  parseDeal,
} from '../src/lib/index-deal-rules';

let pass = 0;
let fail = 0;
function test(name: string, ok: boolean) {
  if (ok) {
    pass++;
    console.log(`  ✓ ${name}`);
  } else {
    fail++;
    console.log(`  ✗ ${name}`);
  }
}

const NOW = new Date('2026-10-23T12:00:00Z');
const ok = (raw: unknown) => parseDeal(raw, NOW);

console.log('\nparseDeal');
{
  const r = ok({
    brand: '  Phantom\n wallet ',
    brandHandle: '@Phantom',
    month: '2026-03',
    postUrl: 'https://twitter.com/Me_1/status/123?s=20',
  });
  test('valid deal parses', r.ok);
  if (r.ok) {
    test('brand is one clean line', r.value.brand === 'Phantom wallet');
    test('handle lowercased, @ dropped', r.value.brandHandle === 'phantom');
    test('month kept', r.value.month === '2026-03');
    test(
      'post link normalised to x.com, query dropped',
      r.value.postUrl === 'https://x.com/Me_1/status/123'
    );
  }
  const min = ok({ brand: 'Jupiter' });
  test(
    'brand alone is enough',
    min.ok &&
      min.value.brandHandle === null &&
      min.value.month === null &&
      min.value.postUrl === null
  );
  test(
    'empty optional strings become null',
    (() => {
      const r2 = ok({ brand: 'Jupiter', brandHandle: '', month: '', postUrl: '  ' });
      return (
        r2.ok &&
        r2.value.brandHandle === null &&
        r2.value.month === null &&
        r2.value.postUrl === null
      );
    })()
  );
  test('no brand → error', !ok({}).ok && !ok({ brand: '   ' }).ok && !ok(null).ok);
  test(`brand over ${BRAND_MAX} → error`, !ok({ brand: 'x'.repeat(BRAND_MAX + 1) }).ok);
  test(`brand at ${BRAND_MAX} ok`, ok({ brand: 'x'.repeat(BRAND_MAX) }).ok);
  test('non-string brand → error', !ok({ brand: 42 }).ok);
  test(
    'bad handle → error',
    !ok({ brand: 'a', brandHandle: 'has space' }).ok &&
      !ok({ brand: 'a', brandHandle: 'x'.repeat(16) }).ok
  );
  test('future month → error', !ok({ brand: 'a', month: '2026-11' }).ok);
  test('current month ok', ok({ brand: 'a', month: '2026-10' }).ok);
  test('before 2015-01 → error', !ok({ brand: 'a', month: '2014-12' }).ok);
  test(
    'malformed month → error',
    !ok({ brand: 'a', month: '2026-13' }).ok &&
      !ok({ brand: 'a', month: '2026-3' }).ok &&
      !ok({ brand: 'a', month: 202603 }).ok
  );
}

console.log('\ncleanPostUrl');
test('x.com status ok', cleanPostUrl('https://x.com/a/status/1') === 'https://x.com/a/status/1');
test(
  'www / mobile twitter ok',
  cleanPostUrl('https://mobile.twitter.com/a/status/9/photo/1') === 'https://x.com/a/status/9'
);
test('http rejected', cleanPostUrl('http://x.com/a/status/1') === false);
test('other host rejected', cleanPostUrl('https://evil.com/x.com/a/status/1') === false);
test('lookalike host rejected', cleanPostUrl('https://x.com.evil.com/a/status/1') === false);
test('profile link rejected', cleanPostUrl('https://x.com/a') === false);
test(
  'javascript: rejected',
  cleanPostUrl('javascript:alert(1)//https://x.com/a/status/1') === false
);
test('userinfo trick rejected', cleanPostUrl('https://x.com@evil.com/a/status/1') === false);
test('non-string rejected', cleanPostUrl(5) === false);

console.log('\ncleanHandle');
test('null/empty → null', cleanHandle(null) === null && cleanHandle('  ') === null);
test('@ and case', cleanHandle('@Foo_Bar') === 'foo_bar');
test('invalid → false', cleanHandle('foo-bar') === false && cleanHandle(1) === false);

console.log('\nmisc');
test('MAX_DEALS is 10', MAX_DEALS === 10);
test('monthOf is UTC', monthOf(new Date('2026-01-01T00:30:00+02:00')) === '2025-12');

console.log('\nmigration 046 matches the rules');
{
  const sql = readFileSync('supabase-migrations/046_index_deals.sql', 'utf8');
  test('RLS enabled', /ENABLE ROW LEVEL SECURITY/.test(sql));
  test(
    'anon/authenticated revoked',
    /REVOKE ALL ON TABLE public\."IndexDeal" FROM anon, authenticated/.test(sql)
  );
  test('brand length check matches BRAND_MAX', sql.includes(`BETWEEN 1 AND ${BRAND_MAX}`));
  test('cascade from IndexEntry', /REFERENCES "IndexEntry"\("id"\) ON DELETE CASCADE/.test(sql));
  const urlCheck = /"postUrl"\s+TEXT CHECK \("postUrl" ~ '([^']+)'\)/.exec(sql);
  const re = urlCheck ? new RegExp(urlCheck[1]) : null;
  test(
    'every normalised post link passes the DB check',
    !!re && re.test(cleanPostUrl('https://twitter.com/Me_1/status/123?s=1') as string)
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
