/**
 * Growth dashboard metrics (src/lib/growth-metrics.ts). Pure, no network/DB:
 *   npm run test:growth
 */
import {
  bestAndWorst,
  reachOutlier,
  delta,
  followerSeries,
  formatOf,
  formatPerformance,
  peakHour,
  type PostRow,
  type SnapshotRow,
} from '../src/lib/growth-metrics';
import { audienceSummary, type InteractionRow } from '../src/lib/audience-metrics';

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

const at = (d: number, h = 12) => new Date(Date.UTC(2026, 9, d, h));
const post = (i: number, o: Partial<PostRow> = {}): PostRow => ({
  tweetId: String(i),
  text: `a normal post with an actual idea in it, number ${i}`,
  postedAt: at(1 + i),
  likes: 20,
  replies: 5,
  reposts: 3,
  quotes: 2,
  bookmarks: 0,
  views: 1000,
  media: [],
  isQuote: false,
  ...o,
});

console.log('A. Formats');
test('🧵 → thread', formatOf(post(1, { text: 'how i did it 🧵' })) === 'thread');
test('1/5 → thread', formatOf(post(1, { text: '1/5 the playbook' })) === 'thread');
test('photo → media', formatOf(post(1, { media: ['photo'] })) === 'media');
test('quote → quote', formatOf(post(1, { isQuote: true })) === 'quote');
test('plain → text', formatOf(post(1)) === 'text');
test(
  'X Article link → article',
  formatOf(post(1, { text: 'https://x.com/i/article/2115026387115327488' })) === 'article'
);
test(
  'article beats media',
  formatOf(post(1, { text: 'new piece x.com/i/article/1', media: ['photo'] })) === 'article'
);
test(
  'a t.co link alone is not an article',
  formatOf(post(1, { text: 'https://t.co/abc' })) === 'text'
);
const perf = formatPerformance([
  post(1, { media: ['photo'], likes: 60 }),
  post(2, { media: ['video'], likes: 60 }),
  post(3),
  post(4),
]);
const media = perf.find((f) => f.format === 'media')!;
const text = perf.find((f) => f.format === 'text')!;
test('media rate (60+5+3+2)/1000 = 7%', Math.abs((media.rate ?? 0) - 7) < 1e-9);
test('text rate 3%', Math.abs((text.rate ?? 0) - 3) < 1e-9);
test('shares 50/50', media.share === 50 && text.share === 50);
test('formats with no posts are left out', !perf.some((f) => f.format === 'thread'));

console.log('B. Peak hour');
const hours = [
  post(1, { postedAt: at(2, 15), likes: 80 }),
  post(2, { postedAt: at(3, 15), likes: 70 }),
  post(3, { postedAt: at(4, 9) }),
  post(4, { postedAt: at(5, 9) }),
  post(5, { postedAt: at(6, 22), likes: 500 }), // one-off: ignored (needs 2+)
];
test('15:00 UTC wins (2+ posts, best average)', peakHour(hours) === 15);
test('no view counts → null', peakHour([post(1, { views: 0 }), post(2, { views: 0 })]) === null);

console.log('C. Best and worst posts');
const set = [
  post(1, { likes: 90, media: ['photo'] }),
  post(2, { likes: 60 }),
  post(3),
  post(4),
  post(5, { text: 'gm', likes: 1, replies: 0, reposts: 0, quotes: 0 }),
  post(6, { likes: 999, views: 50 }), // tiny reach: excluded from ranking
];
const bw = bestAndWorst(set);
test('best is the media post', bw.best[0]?.p.tweetId === '1');
test('tiny-reach outlier excluded', !bw.best.some((b) => b.p.tweetId === '6'));
test('worst is the "gm" post', bw.worst?.p.tweetId === '5');
test('best reason mentions media', /with media/.test(bw.best[0]?.why ?? ''));
test('worst reason says short', /very short/.test(bw.worst?.why ?? ''));
test('under 3 rated posts → nothing', bestAndWorst([post(1), post(2)]).best.length === 0);
{
  const usual = Array.from({ length: 9 }, (_, i) => ({ ...post(i + 1), views: 1000 }));
  const viral = { ...post(0), views: 127_000 };
  const o = reachOutlier([viral, ...usual]);
  test(
    'viral post called out at 127× the usual',
    o?.tweetId === viral.tweetId && o?.multiple === 127
  );
  test('no outlier when reach is even', reachOutlier(usual) === null);
  test('too few posts → no outlier', reachOutlier([viral, ...usual.slice(0, 2)]) === null);
}

console.log('D. Deltas + series');
const snap = (d: number, followers: number, er: number | null = 2): SnapshotRow => ({
  day: new Date(Date.UTC(2026, 9, d)),
  followers,
  postsPerDay: 2,
  engagementRate: er,
  mediaShare: 0.3,
  avgViews: 1000,
  samplePosts: 40,
});
const snaps = [snap(1, 1000), snap(8, 1100, 2.5), snap(15, 1250, 3)];
test('followers +150 over 7 days', delta(snaps, (s) => s.followers) === 150);
test('engagement +0.5', Math.abs((delta(snaps, (s) => s.engagementRate) ?? 0) - 0.5) < 1e-9);
test('one snapshot → no delta', delta([snap(1, 1000)], (s) => s.followers) === null);
test(
  'unknown engagement → null delta',
  delta([snap(1, 10, null), snap(8, 12)], (s) => s.engagementRate) === null
);
test('series oldest → newest', followerSeries([snap(15, 3), snap(1, 1)])[0].followers === 1);

console.log('E. Audience');
const ir = (handle: string, tweetId: string, kind: string, followers = 100): InteractionRow => ({
  tweetId,
  handle,
  displayHandle: handle,
  name: null,
  followers,
  kind,
});
const aud = audienceSummary([
  ir('amy', 't1', 'reply'),
  ir('amy', 't2', 'reply'),
  ir('amy', 't2', 'repost'),
  ir('bob', 't1', 'reply', 50_000),
  ir('cat', 't1', 'quote'),
  ir('cat', 't3', 'repost'),
]);
test('3 people', aud.people === 3);
test('returning = engaged with 2+ posts (amy, cat)', aud.returning === 2);
test('top engager is amy (3 interactions)', aud.topEngagers[0]?.handle === 'amy');
test('top amplifier is cat (quote + repost)', aud.topAmplifiers[0]?.handle === 'cat');
test('notable = 10K+ followers (bob)', aud.notable.length === 1 && aud.notable[0].handle === 'bob');
test('read from 3 posts', aud.posts === 3);
test('empty → no share', audienceSummary([]).returningShare === null);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
