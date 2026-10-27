/**
 * "Why my score moved" (src/lib/score-moves.ts), the growth line
 * (src/lib/growth-proof.ts) and the auto re-read picker
 * (src/lib/auto-reread-rules.ts). Pure, no network/DB:
 *   npm run test:moves
 */
import { explainMove, type PostPoint, type ReadPoint } from '../src/lib/score-moves';
import { growthProof, proofParts } from '../src/lib/growth-proof';
import { rereadDue, REREAD_AFTER_DAYS } from '../src/lib/auto-reread-rules';

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

const D = (day: number) => new Date(Date.UTC(2026, 9, 1) + day * 86_400_000);
const read = (
  day: number,
  score: number,
  phases: [number, number, number, number] | null
): ReadPoint => ({
  id: `r${day}`,
  at: D(day),
  score,
  phases: phases
    ? { define: phases[0], check: phases[1], generate: phases[2], scale: phases[3] }
    : null,
});
const post = (id: string, day: number, fit: number, multiple: number | null): PostPoint => ({
  tweetId: id,
  postedAt: D(day),
  fit,
  multiple,
  excerpt: `post ${id}`,
});

console.log('A. Why my score moved');
const reads = [read(0, 72, [78, 71, 68, 69]), read(5, 75, [78, 71, 73, 70])];
const posts = [
  post('old', -3, 95, 9), // before the previous read: must not count
  post('thread', 2, 88, 3.1),
  post('quote', 3, 70, 1.6),
  post('gm', 4, 40, 0.2),
];
const m = explainMove(reads, posts, { followersDelta: 120 });
test('72 → 75 is +3', m?.delta === 3 && m.from === 72 && m.to === 75, m);
test(
  'biggest move first (Generate +5)',
  m?.phases[0].phase === 'generate' && m.phases[0].delta === 5
);
test(
  'Generate up points at the posts that beat usual reach, best first',
  m?.phases[0].posts.map((p) => p.tweetId).join() === 'thread,quote',
  m?.phases[0].posts
);
test('reason names the multiple', m?.phases[0].posts[0].reason === '3.1× your usual likes');
test('posts before the previous read never count', !JSON.stringify(m).includes('"old"'));
test('unchanged phases (Define, Check) are left out', m?.phases.length === 2);
const scale = m?.phases.find((p) => p.phase === 'scale');
test('Scale +1 attributed to above-usual reach', scale?.posts[0]?.tweetId === 'thread');

const down = explainMove([read(0, 75, [80, 75, 72, 70]), read(4, 71, [74, 70, 72, 70])], posts);
const def = down?.phases.find((p) => p.phase === 'define');
test('Define down points at the off-brand post', def?.posts[0]?.tweetId === 'gm', def);
test('off-brand reason shows the fit', def?.posts[0]?.reason === 'off-brand, fit 40');

const noPosts = explainMove([read(0, 70, [70, 70, 70, 60]), read(4, 72, [70, 70, 70, 64])], [], {
  followersDelta: 421,
});
test(
  'no posts: Scale explained by the follower change',
  noPosts?.phases[0].note === '+421 followers since the last read',
  noPosts
);
const noPosts2 = explainMove([read(0, 70, [60, 70, 70, 70]), read(4, 72, [64, 70, 70, 70])], []);
test(
  'no posts, no signal: says so plainly',
  noPosts2?.phases[0].note === 'From the overall read; no single post stands out.'
);
test('one read → nothing to compare', explainMove([reads[0]], posts) === null);
test(
  'missing phases → overall change only',
  explainMove([read(0, 60, null), read(3, 64, [1, 1, 1, 1])], posts)?.phases.length === 0
);
const fallback = explainMove(
  [read(0, 70, [70, 70, 60, 70]), read(2, 73, [70, 70, 64, 70])],
  [post('lastweek', -2, 85, 2.4)]
);
test(
  'reads a day apart, nothing scored between: uses the week before the latest read',
  fallback?.phases[0].posts[0]?.tweetId === 'lastweek',
  fallback
);

console.log('B. Growth line ("since you joined")');
const snaps = [
  { day: D(0), followers: 1000, avgViews: 2000 },
  { day: D(4), followers: 1100, avgViews: 2400 },
  { day: D(10), followers: 1412, avgViews: 2760 },
];
const g = growthProof(D(0), snaps, 9);
test('+412 followers over 10 days', g?.followers === 412 && g.days === 10, g);
test('reach up 38%', g?.reachPct === 38);
test(
  'reads as one line',
  proofParts(g!).join(' · ') === '+412 followers · reach up 38% · 9 posts scored 80+'
);
test('hidden under a week of tracking', growthProof(D(0), snaps.slice(0, 2), 3) === null);
test('snapshots before joining are ignored', growthProof(D(5), snaps, 0) === null);
test(
  'unknown views → reach left out',
  proofParts(
    growthProof(
      D(0),
      snaps.map((s) => ({ ...s, avgViews: 0 })),
      0
    )!
  ).join() === '+412 followers'
);

console.log('C. Auto re-read: who is due');
const now = D(30);
const base = { lastVisitAt: D(28), lastReadAt: D(25), hasX: true };
test('active member with a 5-day-old read is due', rereadDue(base, now));
test(
  `read under ${REREAD_AFTER_DAYS} days old → skip (manual rescan counts)`,
  !rereadDue({ ...base, lastReadAt: D(29) }, now)
);
test('no visit in 7 days → skip', !rereadDue({ ...base, lastVisitAt: D(20) }, now));
test('never visited → skip', !rereadDue({ ...base, lastVisitAt: null }, now));
test('no X connection → skip', !rereadDue({ ...base, hasX: false }, now));
test('never read → due', rereadDue({ ...base, lastReadAt: null }, now));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
