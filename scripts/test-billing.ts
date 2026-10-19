/**
 * Billing rules for the launch (docs/LAUNCH-PLAN.md). Pure, no network/DB:
 *   npm run test:billing
 */
import { hasPro, mapStripeStatus, trialEndsAt } from '../src/lib/billing';
import { TRIAL_DAYS, FOUNDING_SPOTS, PLAN_CONFIGS } from '../src/lib/plans';

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

console.log('A. Who gets Pro');
const u = (subscriptionTier: string, subscriptionStatus: string, role = 'user') => ({
  subscriptionTier,
  subscriptionStatus,
  role,
});
test('Pro + trialing → Pro', hasPro(u('PRO', 'TRIALING')));
test('Pro + active → Pro', hasPro(u('PRO', 'ACTIVE')));
test('Pro + past_due (failed charge at trial end) → Free', !hasPro(u('PRO', 'PAST_DUE')));
test('Pro + canceled → Free', !hasPro(u('PRO', 'CANCELED')));
test('Pro + incomplete → Free', !hasPro(u('PRO', 'INCOMPLETE')));
test('Free + active (the default for every account) → Free', !hasPro(u('FREE', 'ACTIVE')));
test('legacy CREATOR + active → Free', !hasPro(u('CREATOR', 'ACTIVE')));
test('admin on Free → Pro (founder is never paywalled)', hasPro(u('FREE', 'ACTIVE', 'admin')));

console.log('B. Stripe status mapping (bug: unknown statuses used to map to ACTIVE)');
test('active → ACTIVE', mapStripeStatus('active') === 'ACTIVE');
test('trialing → TRIALING', mapStripeStatus('trialing') === 'TRIALING');
test('past_due → PAST_DUE', mapStripeStatus('past_due') === 'PAST_DUE');
test('unpaid → PAST_DUE (not ACTIVE)', mapStripeStatus('unpaid') === 'PAST_DUE');
test('paused → INCOMPLETE (not ACTIVE)', mapStripeStatus('paused') === 'INCOMPLETE');
test('canceled → CANCELED', mapStripeStatus('canceled') === 'CANCELED');
test('incomplete_expired → INCOMPLETE', mapStripeStatus('incomplete_expired') === 'INCOMPLETE');
test('unknown → not entitled', !hasPro(u('PRO', mapStripeStatus('something_new'))));

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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
