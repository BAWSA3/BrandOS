/**
 * Growth dashboard accounts (src/lib/tracked-accounts.ts). Pure, no network/DB:
 *   npm run test:accounts
 */
import {
  brandLimit,
  cleanHandle,
  snapshotFields,
  vouchesForCompany,
} from '../src/lib/tracked-accounts';
import { analyzeTweets } from '../src/lib/tweet-analysis';
import { OPEN_ACCESS_UNTIL } from '../src/lib/plans';

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

const AFTER = new Date(OPEN_ACCESS_UNTIL.getTime() + 1000);
const DURING = new Date(OPEN_ACCESS_UNTIL.getTime() - 86_400_000);
const u = (subscriptionTier: string, subscriptionStatus: string, role = 'user') => ({
  subscriptionTier,
  subscriptionStatus,
  role,
});

console.log('A. Brand limits (Pro 1 · Team 5 · Agency 20)');
test('Pro → 1 after the launch window', brandLimit(u('PRO', 'ACTIVE'), AFTER) === 1);
// Team → 5: the TEAM subscription tier lands with the tiers work (Oct 30–31); add the check then
test('Agency → 20', brandLimit(u('AGENCY', 'ACTIVE'), AFTER) === 20);
test('free after the window → 1', brandLimit(u('FREE', 'ACTIVE'), AFTER) === 1);
test('anyone during the window → 5', brandLimit(u('FREE', 'ACTIVE'), DURING) === 5);
test('Agency during the window keeps 20', brandLimit(u('AGENCY', 'TRIALING'), DURING) === 20);
test('admin → 20', brandLimit(u('FREE', 'ACTIVE', 'admin'), AFTER) === 20);

console.log('B. Handles');
test('@Foo → Foo', cleanHandle('@Foo') === 'Foo');
test('x.com url', cleanHandle('https://x.com/0xHvdes?s=20') === '0xHvdes');
test('twitter.com url', cleanHandle('twitter.com/galileowilson') === 'galileowilson');
test('spaces trimmed', cleanHandle('  jbawsa ') === 'jbawsa');
test('too long → null', cleanHandle('a'.repeat(16)) === null);
test('invalid chars → null', cleanHandle('not a handle') === null);

console.log('C. Snapshot from a sync');
const t = (i: number, media: string[] = [], views = 1000) => ({
  id: String(i),
  text: `post ${i}`,
  created_at: new Date(Date.UTC(2026, 9, 1 + i)).toISOString(),
  public_metrics: {
    like_count: 10,
    retweet_count: 2,
    reply_count: 3,
    quote_count: 1,
    impression_count: views,
  },
  media,
});
const snap = snapshotFields(
  { followers_count: 5000, following_count: 300, tweet_count: 900, listed_count: 12 },
  analyzeTweets([t(1, ['photo']), t(2), t(3, ['video']), t(4)])
);
test(
  'profile counts copied',
  snap.followers === 5000 && snap.postsTotal === 900 && snap.listed === 12
);
test('media share 2 of 4 → 0.5', snap.mediaShare === 0.5);
test('avg views 1000', snap.avgViews === 1000);
test('engagement 1.6%', Math.abs((snap.engagementRate ?? 0) - 1.6) < 1e-9);
const noViews = snapshotFields(
  { followers_count: 1, following_count: 1, tweet_count: 1, listed_count: 0 },
  analyzeTweets([t(1, [], 0), t(2, [], 0)])
);
test('no views → engagement null (unknown, not 0)', noViews.engagementRate === null);

// Company framing: only the handle's owner or an admin rewords the shared read
const vouch = (xUserId: string | null, role: string, xUserIds: string[]) =>
  vouchesForCompany({ xUserId, addedBy: { role, xUserIds } });
test('owner (same X id) marks own account as a company', vouch('42', 'user', ['42']));
test('another user marking it changes nothing for others', !vouch('42', 'user', ['7']));
test('admin can mark any account', vouch('42', 'admin', []));
test('unknown X id never matches', !vouch(null, 'user', ['42']));
test('deleted adder never vouches', !vouchesForCompany({ xUserId: '42', addedBy: null }));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
