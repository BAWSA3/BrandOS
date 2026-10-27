/**
 * Dashboard v2: the tester gate (src/lib/dashboard-v2-rules.ts) and today's
 * move (src/lib/next-move.ts). Pure, no network/DB:
 *   npm run test:dash-v2
 */
import { dashboardV2Rule } from '../src/lib/dashboard-v2-rules';
import { nextMoves, pickIndex, type MoveInput } from '../src/lib/next-move';
import { bodyOfWork, workLine } from '../src/lib/playbook';

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

console.log('gate');
test(
  'flag off → off, even for admin',
  !dashboardV2Rule({ envFlag: undefined, role: 'admin', redeemed: true })
);
test('flag "0" → off', !dashboardV2Rule({ envFlag: '0', role: 'admin', redeemed: true }));
test(
  'flag on, public member → off',
  !dashboardV2Rule({ envFlag: '1', role: 'user', redeemed: false })
);
test(
  'flag on, redeemed code → on',
  dashboardV2Rule({ envFlag: '1', role: 'user', redeemed: true })
);
test(
  'flag on, admin without code → on',
  dashboardV2Rule({ envFlag: 'true', role: 'admin', redeemed: false })
);
test(
  'flag " ON " (spaces, caps) → on',
  dashboardV2Rule({ envFlag: ' ON ', role: null, redeemed: true })
);
test('flag "yes" is not on', !dashboardV2Rule({ envFlag: 'yes', role: 'admin', redeemed: true }));

console.log('next move');
const base: MoveInput = {
  handle: 'jbawsa',
  outlier: null,
  formats: [],
  score: null,
  ideas: [],
};
test('nothing in the record → no moves (Today shows its fallback)', nextMoves(base).length === 0);

const full: MoveInput = {
  ...base,
  outlier: {
    tweetId: '9',
    text: 'i asked 40 brands why they skipped creators',
    views: 127_000,
    multiple: 41,
  },
  formats: [
    { format: 'text', label: 'Text only', rate: 1.4, share: 31, posts: 12 },
    { format: 'thread', label: 'Threads', rate: 3.4, share: 2, posts: 1 },
    { format: 'media', label: 'With media', rate: 2.9, share: 22, posts: 9 },
    { format: 'quote', label: 'Quote posts', rate: 2.2, share: 24, posts: 10 },
  ],
  score: {
    value: 72,
    weakest: 'generate',
    phases: { define: 78, check: 71, generate: 68, scale: 69 },
    nextMoves: ['Post one breakdown of a brand deal this week.'],
  },
  ideas: [
    { id: 'a', text: 'How I priced my first brand deal', status: 'saved' },
    { id: 'b', text: 'Why I stopped posting gm', status: 'drafting' },
    { id: 'c', text: 'Shipped', status: 'posted' },
  ],
};
const m = nextMoves(full);
test(
  'creator: builds on the outlier first',
  m[0]?.kind === 'build',
  m.map((x) => x.kind)
);
test('outlier stat is the real multiple', m[0]?.stat?.value === 41 && m[0]?.stat?.suffix === '×');
test(
  'finish picks the drafting idea over a saved one',
  m.find((x) => x.kind === 'finish')?.id === 'finish-b'
);
test(
  'finish counts open ideas only (saved + drafting)',
  m.find((x) => x.kind === 'finish')?.stat?.value === 2
);
const fix = m.find((x) => x.kind === 'fix');
test('format move never pushes threads', !!fix && fix.id === 'fix-media', fix?.id);
test(
  'phase move uses the read’s own next move',
  m.find((x) => x.kind === 'phase')?.title === full.score!.nextMoves[0]
);
test(
  'every move has a link',
  m.every((x) => x.action.href.startsWith('/dashboard'))
);
test(
  'no hashtag advice in any move',
  m.every(
    (x) => !/#[a-z]{2,}/i.test(`${x.title} ${x.why}`) && !/hashtag/i.test(`${x.title} ${x.why}`)
  )
);
test(
  'write links carry the prompt, encoded',
  m[0].action.href.startsWith('/dashboard/write?prompt=A%20follow-up')
);

const f = nextMoves(full, 'founder', 'company');
test(
  'founder: finishing something comes first',
  f[0]?.kind === 'finish',
  f.map((x) => x.kind)
);
test(
  'founder for company: prompt says so',
  decodeURIComponent(f[0].action.href).includes('for my company')
);
test(
  'builder: prompt asks to show the work',
  decodeURIComponent(nextMoves(full, 'builder')[0].action.href).includes('what I built')
);

test(
  'format move needs a real lift (30%+)',
  !nextMoves({
    ...base,
    formats: [
      { format: 'text', label: 'Text only', rate: 2.0, share: 60, posts: 20 },
      { format: 'media', label: 'With media', rate: 2.2, share: 20, posts: 7 },
    ],
  }).some((x) => x.kind === 'fix')
);
test(
  'a small outlier (<5×) is not a move',
  !nextMoves({ ...base, outlier: { ...full.outlier!, multiple: 3 } }).length
);

console.log('day pick');
test('stable within a day', pickIndex(4, '2026-10-27') === pickIndex(4, '2026-10-27'));
test(
  'only the first two are today candidates',
  [...Array(30)].every((_, i) => pickIndex(4, `2026-10-${i + 1}`) < 2)
);
test('one move → index 0', pickIndex(1, '2026-10-27') === 0);

console.log('playbook: body of work');
{
  const now = new Date(Date.UTC(2026, 9, 27, 15));
  const d = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86_400_000);
  const w = bodyOfWork(
    {
      ideas: [
        { createdAt: d(1), status: 'saved' },
        { createdAt: d(2), status: 'drafting' },
        { createdAt: d(3), status: 'posted' },
        { createdAt: d(20), status: 'saved' },
        { createdAt: d(80), status: 'posted' }, // older than 8 weeks: ignored
      ],
      posts: [{ postedAt: d(0) }, { postedAt: d(10) }, { postedAt: d(400) }],
      reads: [
        { at: d(30), score: 68 },
        { at: d(4), score: 72 },
      ],
    },
    now
  );
  test('8 weeks, oldest first', w.length === 8 && w[0].start < w[7].start);
  test('this week counts today', w[7].ideas === 3 && w[7].posts === 1, w[7]);
  test('drafts = ideas taken to drafting or posted', w[7].drafts === 2);
  test(
    'ideas/posts outside the window are ignored',
    w.reduce((a, x) => a + x.ideas, 0) === 4 && w.reduce((a, x) => a + x.posts, 0) === 2
  );
  test('score carries forward from the last read', w[7].score === 72 && w[5].score === 68);
  test('no score before the first read', w[0].score === null);
  test('work line', workLine(w) === '4 ideas → 2 drafts → 2 posts · score 68 → 72', workLine(w));
  test(
    'work line is null with nothing yet',
    workLine(bodyOfWork({ ideas: [], posts: [], reads: [] }, now)) === null
  );
}

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
