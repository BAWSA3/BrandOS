/**
 * "How many bots follow you?" (src/lib/bot-check.ts). Pure, no network/DB:
 *   npm run test:bots
 */
import {
  BOT_RULES,
  classify,
  cleanBotHandle,
  shapeBotCheck,
  summarize,
  viewerFor,
  type BotCheckRecord,
} from '../src/lib/bot-check';
import type { XAccount } from '../src/lib/socialdata';

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

const NOW = Date.parse('2026-10-23T00:00:00Z');
const daysAgo = (d: number) => new Date(NOW - d * 86_400_000).toUTCString();
const acct = (o: Partial<XAccount> = {}): XAccount => ({
  id: '1',
  handle: 'someone',
  name: 'Someone',
  bio: 'builder, writer',
  followers: 400,
  following: 300,
  posts: 1200,
  likes: 5000,
  createdAt: daysAgo(900),
  defaultAvatar: false,
  ...o,
});

// classify
test('ordinary account reads as real', classify(acct(), NOW).verdict === 'real');
test(
  'no bio alone is still real (one weak signal)',
  classify(acct({ bio: '' }), NOW).verdict === 'real'
);
test(
  'egg + no bio = suspicious, not a bot',
  classify(acct({ defaultAvatar: true, bio: '' }), NOW).verdict === 'suspicious'
);
test(
  'egg + lopsided follows = likely bot',
  classify(acct({ defaultAvatar: true, followers: 2, following: 900 }), NOW).verdict === 'bot'
);
test(
  'new, silent, numbered, no bio = likely bot',
  classify(
    acct({ createdAt: daysAgo(10), posts: 0, likes: 0, bio: '', handle: 'user8812345' }),
    NOW
  ).verdict === 'bot'
);
test(
  'big real account following many is not "lopsided"',
  !classify(acct({ followers: 5000, following: 4000 }), NOW).signals.includes('lopsided')
);
test(
  'unparseable creation date never flags as new',
  !classify(acct({ createdAt: 'garbage' }), NOW).signals.includes('newAccount')
);
test('thresholds are ordered', BOT_RULES.botAt > BOT_RULES.suspiciousAt);

// summarize
const s = summarize(
  [
    acct(),
    acct({ id: '2', handle: 'egg', defaultAvatar: true, bio: '' }),
    acct({ id: '3', handle: 'bot123456', defaultAvatar: true, followers: 0, following: 999 }),
    acct({ id: '4' }),
  ],
  NOW
);
test(
  'counts add up',
  s.group.sampled === 4 && s.group.real === 2 && s.group.suspicious === 1 && s.group.bot === 1
);
test('% real is a whole number', s.group.pctReal === 50);
test('flagged lists only non-real accounts', s.flagged.length === 2);
test('reasons count signals among flagged only', s.group.reasons.noAvatar === 2);
test('empty sample → pctReal null', summarize([], NOW).group.pctReal === null);

// handles
test('strips @', cleanBotHandle('@jbawsa') === 'jbawsa');
test('accepts a profile URL', cleanBotHandle('https://x.com/jbawsa?s=21') === 'jbawsa');
test('rejects junk', cleanBotHandle('drop table;') === null && cleanBotHandle(42) === null);
test('rejects too long', cleanBotHandle('a'.repeat(16)) === null);

// who sees what
const rec: BotCheckRecord = {
  handle: 'jbawsa',
  xUserId: '42',
  name: 'J',
  followerCount: 31000,
  followers: s.group,
  engagers: null,
  notable: [],
  checkedAt: new Date(NOW).toISOString(),
  flagged: { followers: s.flagged, engagers: [] },
};
const pub = shapeBotCheck(rec, 'public');
const mem = shapeBotCheck(rec, 'member');
const own = shapeBotCheck(rec, 'owner');
test('public: no flagged accounts', !('flagged' in pub));
test('public: no reason counts', !('reasons' in pub.followers));
test(
  'signed-in non-owner: reasons, but no flagged accounts',
  'reasons' in mem.followers && !('flagged' in mem)
);
test('owner: flagged accounts', own.flagged?.followers.length === 2);
test(
  'public JSON never contains a flagged handle',
  !JSON.stringify(pub).includes('bot123456') && !JSON.stringify(mem).includes('bot123456')
);
test('signed out → public', viewerFor(null, rec) === 'public');
test('same X id → owner', viewerFor({ xUserIds: ['42'] }, rec) === 'owner');
test('other X id → member', viewerFor({ xUserIds: ['7'] }, rec) === 'member');
test('empty stored id never matches', viewerFor({ xUserIds: [''] }, { xUserId: '' }) === 'member');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
