/**
 * Daily scan limit (src/lib/scan-quota-rules.ts). Pure, no network/DB:
 *   npm run test:scan-quota
 */
import {
  allowanceFor,
  counterLine,
  FREE_SCANS_PER_DAY,
  limitBody,
  limitCopy,
  quotaView,
  resetsAt,
  resetsIn,
  SIGNED_OUT_SCANS_PER_DAY,
  UPGRADE_URL,
  utcDay,
} from '../src/lib/scan-quota-rules';
import { mentionsHashtags } from '../src/lib/no-hashtag-advice';

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

console.log('allowance');
const out = allowanceFor({ signedIn: false, admin: false, subscribed: false });
const free = allowanceFor({ signedIn: true, admin: false, subscribed: false });
test('signed out: 1 a day', !out.unlimited && out.limit === 1 && !out.signedIn);
test('signed in, not paying (trial included): 3 a day', !free.unlimited && free.limit === 3);
test('paid: unlimited', allowanceFor({ signedIn: true, admin: false, subscribed: true }).unlimited);
test(
  'admin: unlimited',
  allowanceFor({ signedIn: true, admin: true, subscribed: false }).unlimited
);
test('constants match the decision', SIGNED_OUT_SCANS_PER_DAY === 1 && FREE_SCANS_PER_DAY === 3);

console.log('day + reset (UTC)');
const late = new Date('2026-10-29T23:30:00Z');
test('utcDay', utcDay(late) === '2026-10-29');
test('utcDay ignores local offset', utcDay(new Date('2026-10-30T00:10:00+02:00')) === '2026-10-29');
test('resets at next midnight UTC', resetsAt(late).toISOString() === '2026-10-30T00:00:00.000Z');
test(
  'month rollover',
  resetsAt(new Date('2026-10-31T12:00:00Z')).toISOString() === '2026-11-01T00:00:00.000Z'
);
test('resetsIn minutes', resetsIn(late) === '30m');
test('resetsIn hours', resetsIn(new Date('2026-10-29T18:00:00Z')) === '6h');
test('resetsIn never 0', resetsIn(new Date('2026-10-29T23:59:59.900Z')) === '1m');

console.log('view + counter');
const now = new Date('2026-10-29T12:00:00Z');
const v1 = quotaView(free, 1, now);
test('2 of 3 left', v1.left === 2 && counterLine(v1) === '2 of 3 scans left today');
test('none left', counterLine(quotaView(free, 3, now)) === 'No scans left today');
test('over-count clamps to 0 left', quotaView(free, 9, now).left === 0);
test('negative used clamps', quotaView(free, -2, now).used === 0);
test('signed out: no counter line', counterLine(quotaView(out, 0, now)) === null);
test('paid: no counter line', counterLine(quotaView({ unlimited: true }, 0, now)) === null);

console.log('limit copy');
const outCopy = limitCopy({ signedIn: false, limit: 1 }, now);
const freeCopy = limitCopy({ signedIn: true, limit: 3 }, now);
test(
  'signed out → sign in with X',
  outCopy.href.startsWith('/signup') && /Sign in with X/.test(outCopy.cta)
);
test(
  'signed in → Founding offer',
  freeCopy.href === UPGRADE_URL && UPGRADE_URL === '/pricing#founding'
);
test(
  'says $29 + Founding 100',
  /\$29\/month/.test(freeCopy.body) && /Founding 100/.test(freeCopy.body)
);
test('says when it resets', /More in 12h/.test(freeCopy.body));
test('no hashtags in copy', ![outCopy, freeCopy].some((c) => mentionsHashtags(c.title + c.body)));
const body = limitBody(quotaView(free, 3, now), now);
test(
  '429 body has code + upgradeUrl',
  body.code === 'SCAN_LIMIT' && body.upgradeUrl === UPGRADE_URL
);
test('429 body error is readable', body.error.startsWith("That's your 3 reads"));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
