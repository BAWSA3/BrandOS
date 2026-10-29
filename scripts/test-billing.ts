/**
 * Billing rules for the launch (docs/LAUNCH-PLAN.md). Pure, no network/DB:
 *   npm run test:billing
 */
import {
  freeAccessEndsAt,
  hasPro,
  inCodeTrial,
  isOpenAccess,
  isSubscribed,
  mapStripeStatus,
  periodEndOf,
  trialEndsAt,
} from '../src/lib/billing';
import { TRIAL_DAYS, FOUNDING_SPOTS, OPEN_ACCESS_UNTIL, PLAN_CONFIGS } from '../src/lib/plans';
import { viewerKey } from '../src/lib/lookups';
import { digestContent } from '../src/lib/lookup-digest';

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

console.log('A. Who gets Pro (after the launch window)');
const u = (subscriptionTier: string, subscriptionStatus: string, role = 'user') => ({
  subscriptionTier,
  subscriptionStatus,
  role,
});
// rules once open access is over (Dec 3)
const AFTER = new Date(OPEN_ACCESS_UNTIL.getTime() + 1000);
test('Pro + trialing → Pro', hasPro(u('PRO', 'TRIALING'), AFTER));
test('Pro + active → Pro', hasPro(u('PRO', 'ACTIVE'), AFTER));
test('Pro + past_due (failed charge at trial end) → Free', !hasPro(u('PRO', 'PAST_DUE'), AFTER));
test('Pro + canceled → Free', !hasPro(u('PRO', 'CANCELED'), AFTER));
test('Pro + incomplete → Free', !hasPro(u('PRO', 'INCOMPLETE'), AFTER));
test('Free + active (the default for every account) → Free', !hasPro(u('FREE', 'ACTIVE'), AFTER));
test('legacy CREATOR + active → Free', !hasPro(u('CREATOR', 'ACTIVE'), AFTER));
test(
  'admin on Free → Pro (founder is never paywalled)',
  hasPro(u('FREE', 'ACTIVE', 'admin'), AFTER)
);

console.log('A2. Launch window: free full access until Dec 3');
const DURING = new Date(OPEN_ACCESS_UNTIL.getTime() - 86_400_000);
test(
  'window ends Dec 3 2026, 9am PT',
  OPEN_ACCESS_UNTIL.toISOString() === '2026-12-03T17:00:00.000Z'
);
test('open the day before', isOpenAccess(DURING));
test('closed after', !isOpenAccess(AFTER));
test('free account → Pro during the window', hasPro(u('FREE', 'ACTIVE'), DURING));
test('canceled account → Pro during the window', hasPro(u('PRO', 'CANCELED'), DURING));
test(
  'free account is NOT subscribed (checkout + return sync still work)',
  !isSubscribed(u('FREE', 'ACTIVE'))
);
test('founding card (trialing) is subscribed', isSubscribed(u('PRO', 'TRIALING')));

console.log('B. Stripe status mapping (bug: unknown statuses used to map to ACTIVE)');
test('active → ACTIVE', mapStripeStatus('active') === 'ACTIVE');
test('trialing → TRIALING', mapStripeStatus('trialing') === 'TRIALING');
test('past_due → PAST_DUE', mapStripeStatus('past_due') === 'PAST_DUE');
test('unpaid → PAST_DUE (not ACTIVE)', mapStripeStatus('unpaid') === 'PAST_DUE');
test('paused → INCOMPLETE (not ACTIVE)', mapStripeStatus('paused') === 'INCOMPLETE');
test('canceled → CANCELED', mapStripeStatus('canceled') === 'CANCELED');
test('incomplete_expired → INCOMPLETE', mapStripeStatus('incomplete_expired') === 'INCOMPLETE');
test('unknown → not entitled', !hasPro(u('PRO', mapStripeStatus('something_new')), AFTER));

console.log('C. Trial end');
const end = new Date('2026-11-09T12:00:00Z');
test(
  'trialing → its period end',
  trialEndsAt({
    subscriptionTier: 'PRO',
    subscriptionStatus: 'TRIALING',
    currentPeriodEnd: end,
  })?.getTime() === end.getTime()
);
test(
  'active → no trial end',
  trialEndsAt({ subscriptionTier: 'PRO', subscriptionStatus: 'ACTIVE', currentPeriodEnd: end }) ===
    null
);

console.log('D. Launch settings');
test('trial is 7 days', TRIAL_DAYS === 7);
test('Founding spots = 100', FOUNDING_SPOTS === 100);
test('Pro is $29/mo', PLAN_CONFIGS.PRO.monthlyPrice === 29);

console.log('E. Lookups (counts only, deduped)');
const a1 = viewerKey({ ip: '1.2.3.4', ua: 'Safari' });
const a2 = viewerKey({ ip: '1.2.3.4', ua: 'Safari' });
test('same anonymous visitor, same day → same key', a1 === a2);
test('different visitor → different key', a1 !== viewerKey({ ip: '5.6.7.8', ua: 'Safari' }));
test('anonymous key is a hash, not the IP', a1.startsWith('v:') && !a1.includes('1.2.3.4'));
test('signed-in viewer keyed by account', viewerKey({ userId: 'abc', ip: '1.2.3.4' }) === 'u:abc');
const one = digestContent('jbawsa', { total: 1, page: 1, mcp: 0, compare: 0 }, 72);
const many = digestContent('jbawsa', { total: 12, page: 5, mcp: 4, compare: 3 }, null);
test(
  'digest subject singular',
  one.subject === '@jbawsa, your brand was looked up 1 time this week'
);
test(
  'digest subject plural',
  many.subject === '@jbawsa, your brand was looked up 12 times this week'
);
test(
  'digest never names viewers (counts + type only)',
  !JSON.stringify(many).match(/@(?!jbawsa)[a-z0-9_]+/i)
);

console.log('F. Stored period end (bug: an ended trial kept showing as the renewal date)');
const sub = (status: string, trial_end: number | null, current_period_end: number) => ({
  status,
  trial_end,
  items: { data: [{ current_period_end }] },
});
const TRIAL_END = 1_793_274_798; // Oct 29
const RENEWS = 1_795_348_421; // Nov 22
test(
  'trialing → trial end (first charge date)',
  periodEndOf(sub('trialing', TRIAL_END, RENEWS))?.getTime() === TRIAL_END * 1000
);
test(
  'active after a trial → renewal date, not the old trial end',
  periodEndOf(sub('active', TRIAL_END, RENEWS))?.getTime() === RENEWS * 1000
);
test(
  'active, never trialed → renewal date',
  periodEndOf(sub('active', null, RENEWS))?.getTime() === RENEWS * 1000
);
test(
  'no items → null',
  periodEndOf({ status: 'active', trial_end: null, items: { data: [] } }) === null
);

console.log('\nZ. Invite-only trial (CODE_TRIAL, from Nov 2)');
{
  const NOV5 = new Date('2026-11-05T12:00:00Z');
  const in30 = new Date('2026-12-02T12:00:00Z');
  const coder = { ...u('FREE', 'ACTIVE'), freeUntil: in30 };
  const nocode = { ...u('FREE', 'ACTIVE'), freeUntil: null };
  test('trial on: the launch window is off', !isOpenAccess(NOV5, true));
  test('trial off: the launch window still runs', isOpenAccess(NOV5, false));
  test('code holder inside 30 days → Pro', hasPro(coder, NOV5, true));
  test('code holder after 30 days → Free', !hasPro(coder, new Date('2026-12-03T00:00:00Z'), true));
  test('no code, not paid → Free', !hasPro(nocode, NOV5, true));
  test('paid without a code → Pro', hasPro({ ...u('PRO', 'ACTIVE'), freeUntil: null }, NOV5, true));
  test('admin → Pro', hasPro({ ...u('FREE', 'ACTIVE', 'admin'), freeUntil: null }, NOV5, true));
  test('freeUntil ignored with the trial off', inCodeTrial(coder, NOV5, false) === false);
  test(
    'free access ends at their own date',
    freeAccessEndsAt(coder, NOV5, true)?.getTime() === in30.getTime()
  );
  test('no free access without a code', freeAccessEndsAt(nocode, NOV5, true) === null);
  test(
    'trial off: free access ends at the window',
    freeAccessEndsAt(nocode, NOV5, false)?.getTime() === OPEN_ACCESS_UNTIL.getTime()
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
