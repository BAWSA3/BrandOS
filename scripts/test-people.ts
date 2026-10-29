/**
 * People to know (src/lib/people-to-know-rules.ts) + its Today move
 * (src/lib/next-move.ts). Pure, no network/DB:
 *   npm run test:people
 */
import {
  buildPool,
  connectionTrigger,
  isKnownAccount,
  nextWeek,
  pillarQuery,
  sizeTier,
  validatePicks,
  weekOf,
  type Candidate,
} from '../src/lib/people-to-know-rules';
import { nextMoves, type MoveInput } from '../src/lib/next-move';

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

console.log('known accounts');
test('5× and 1K+ is known', isKnownAccount(5_000, 1_000));
test('just under 5× is not', !isKnownAccount(4_999, 1_000));
test('small member: still needs 1K', !isKnownAccount(900, 50) && isKnownAccount(1_000, 50));
test('a strong read counts at any size', isKnownAccount(200, 5_000, 72));
test('a weak read does not', !isKnownAccount(200, 5_000, 55));

console.log('trigger (either signal)');
test(
  'few known engagers',
  connectionTrigger({ knownEngagers: 1, engagerPosts: 6, weakest: 'generate' }).reason ===
    'engagers'
);
test(
  'scale weakest',
  connectionTrigger({ knownEngagers: 4, engagerPosts: 6, weakest: 'scale' }).reason === 'scale'
);
test(
  'both',
  connectionTrigger({ knownEngagers: 0, engagerPosts: 6, weakest: 'Scale' }).reason === 'both'
);
test(
  'neither',
  !connectionTrigger({ knownEngagers: 3, engagerPosts: 6, weakest: 'define' }).triggered
);
test(
  'no audience data is not "nobody engages"',
  !connectionTrigger({ knownEngagers: 0, engagerPosts: 0, weakest: 'define' }).triggered
);

console.log('size tiers');
test('same size is a peer', sizeTier(1_200, 1_000) === 'peer');
test('5× is one step up', sizeTier(5_000, 1_000) === 'bigger');
test('100× is too big', sizeTier(100_000, 1_000) === null);
test('tiny member uses a 100 floor', sizeTier(150, 20) === 'peer' && sizeTier(20, 20) === null);

console.log('weeks');
test('Thursday → that Monday', weekOf(new Date('2026-10-29T15:00:00Z')) === '2026-10-26');
test('Monday is its own week', weekOf(new Date('2026-10-26T00:30:00Z')) === '2026-10-26');
test(
  'Sunday belongs to the week before',
  weekOf(new Date('2026-11-01T23:00:00Z')) === '2026-10-26'
);
test('next list next Monday', nextWeek(new Date('2026-10-29T15:00:00Z')) === '2026-11-02');

console.log('pillar search');
const q = pillarQuery([
  'Solana Development & Builder Tools',
  'Blockchain Gaming & NFT Economics',
  'AI Agents',
]);
test(
  'two words per pillar, OR-ed, top originals',
  q ===
    '((solana development) OR (blockchain gaming) OR agents) min_faves:20 -filter:replies -filter:retweets'
);
test('no usable words → null', pillarQuery(['& the', '']) === null);

console.log('pool');
const c = (handle: string, followers: number, o: Partial<Candidate> = {}): Candidate => ({
  handle,
  name: handle,
  bio: 'builds things',
  followers,
  canDm: true,
  defaultAvatar: false,
  avatarUrl: null,
  ...o,
});
const pool = buildPool(
  [
    c('me', 1000),
    c('Peer1', 1100),
    c('peer1', 1100),
    c('peer2', 700),
    c('big1', 6000),
    c('nodm', 1000, { canDm: false }),
    c('egg', 1000, { defaultAvatar: true }),
    c('nobio', 1000, { bio: ' ' }),
    c('giant', 900_000),
    c('engager', 1000),
    c('before', 1000),
  ],
  { memberHandle: 'Me', memberFollowers: 1000, exclude: new Set(['engager', 'before']) }
);
const handles = pool.map((p) => p.handle);
test(
  'keeps DM-able, real, right-size people',
  JSON.stringify(handles) === '["Peer1","peer2","big1"]'
);
test('tiers set', pool.find((p) => p.handle === 'big1')?.tier === 'bigger');

console.log('validatePicks');
const picks = validatePicks(
  [
    { handle: '@big1', why: 'Bigger account in your lane.', dm: 'hey, loved your take' },
    { handle: 'peer1', why: 'Same topics.', dm: 'quick q about your last post #web3 #solana' },
    { handle: 'peer2', why: 'Use more hashtags together.', dm: 'hi' },
    { handle: 'stranger', why: 'Not in pool.', dm: 'hi' },
    { handle: 'peer1', why: 'dupe', dm: 'dupe' },
  ],
  pool
);
test('only pool members, no dupes', picks.length === 2);
test('peers first, then bigger', picks[0].tier === 'peer' && picks[1].tier === 'bigger');
test('hashtags stripped from the DM', picks[0].dm === 'quick q about your last post');
test('a hashtag "why" is dropped', !picks.some((p) => p.handle === 'peer2'));
test(
  'max 2 peers + 1 bigger',
  validatePicks(
    ['Peer1', 'peer2', 'big1']
      .map((h) => ({ handle: h, why: 'fits', dm: 'hi' }))
      .concat([{ handle: 'big1', why: 'x', dm: 'y' }]),
    pool
  ).length === 3
);
test('garbage → []', validatePicks('nope', pool).length === 0);
test(
  'organizations are dropped',
  validatePicks([{ handle: 'big1', account: 'organization', why: 'A product.', dm: 'hi' }], pool)
    .length === 0
);

console.log("Today's move");
const base: MoveInput = {
  handle: 'me',
  outlier: null,
  formats: [],
  ideas: [],
  score: {
    value: 60,
    weakest: 'scale',
    phases: { define: 70, check: 64, generate: 58, scale: 46 },
    nextMoves: ['Post more'],
  },
};
const withGap = nextMoves({ ...base, connect: { reason: 'engagers', knownEngagers: 1 } });
test(
  'connect leads when there is a gap',
  withGap[0].kind === 'connect' && withGap[0].action.href.endsWith('#people')
);
test('stat is the known-engager count', withGap[0].stat?.value === 1);
test(
  'scale reason has no stat',
  nextMoves({ ...base, connect: { reason: 'scale', knownEngagers: 3 } })[0].stat === null
);
test('no gap, no connect move', !nextMoves(base).some((m) => m.kind === 'connect'));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
