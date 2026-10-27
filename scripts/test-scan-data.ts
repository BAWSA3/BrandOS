/**
 * Scan data quality (src/lib/tweet-analysis.ts). Pure, no network/DB:
 *   npm run test:scan
 */
import { analyzeTweets, type Tweet } from '../src/lib/tweet-analysis';
import { firstSentences } from '../src/lib/mcp/profile-read';

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

const day = (d: number) => new Date(Date.UTC(2026, 9, 1) + d * 86_400_000).toISOString();
const post = (i: number, o: Partial<Tweet> & { at?: string; views?: number } = {}): Tweet => ({
  id: String(i),
  text: o.text ?? `post ${i}`,
  created_at: o.at ?? day(i),
  public_metrics: {
    like_count: 10,
    retweet_count: 2,
    reply_count: 3,
    quote_count: 1,
    impression_count: o.views ?? 1000,
  },
  media: o.media ?? [],
});

console.log('A. Posting frequency (bug: every account with a pinned post read "5+ per day")');
// 20 posts, one every 2 days, NEWEST FIRST except an old post on top (like a pinned one)
const spaced = Array.from({ length: 20 }, (_, i) => post(i, { at: day(40 - i * 2) }));
const withOldTop = [post(99, { at: day(-100) }), ...spaced];
const a = analyzeTweets(spaced);
test('20 posts over 38 days → ~0.5/day', Math.abs(a.stats.postsPerDay - 19 / 38) < 0.01);
test('labelled "Moderate", not "Very Active"', a.stats.postingFrequency.startsWith('Moderate'));
test('sample span reported (38 days)', Math.round(a.stats.sampleDays) === 38);
const b = analyzeTweets(withOldTop);
test(
  'an old post first no longer reads as 5+/day',
  !b.stats.postingFrequency.startsWith('Very Active')
);
test(
  'order does not matter',
  analyzeTweets([...spaced].reverse()).stats.postsPerDay === a.stats.postsPerDay
);
const burst = Array.from({ length: 12 }, (_, i) =>
  post(i, { at: new Date(Date.UTC(2026, 9, 1, i)).toISOString() })
);
test(
  '12 posts in 11 hours → floored to a day, 11/day',
  analyzeTweets(burst).stats.postsPerDay === 11
);

console.log('B. Media (bug: always 0)');
const media = analyzeTweets([
  post(1, { media: ['photo'] }),
  post(2, { media: ['video'] }),
  post(3),
  post(4),
]);
test('2 of 4 posts with media → 2', media.contentPatterns.mediaUsage === 2);
const legacy: Tweet = {
  ...post(5),
  media: undefined,
  entities: { urls: [{ expanded_url: 'https://pic.twitter.com/x' }] },
};
test(
  'X API fallback (no media list) still uses the url check',
  analyzeTweets([legacy]).contentPatterns.mediaUsage === 1
);

console.log('C. Emoji share (bug: /g regex skipped matches)');
const emoji = analyzeTweets(
  ['gm 🚀', 'ship it 🔥', 'no emoji', 'lfg 🤝'].map((text, i) => post(i, { text }))
);
test('3 of 4 posts with emoji → 75%', emoji.contentPatterns.emojiUsage === 75);

console.log('D. Engagement rate');
const er = analyzeTweets([post(1, { views: 1000 }), post(2, { views: 1000 })]);
test(
  '(likes+reposts+replies+quotes)/views = 1.6%',
  Math.abs(er.stats.avgEngagementRate - 1.6) < 1e-9
);
test('known when views exist', er.stats.engagementRateKnown);
const noViews = analyzeTweets([post(1, { views: 0 }), post(2, { views: 0 })]);
test('no views → flagged unknown (not a fake 0%)', !noViews.stats.engagementRateKnown);
const mixed = analyzeTweets([post(1, { views: 1000 }), post(2, { views: 0 })]);
test(
  'posts without views do not deflate the rate',
  Math.abs(mixed.stats.avgEngagementRate - 1.6) < 1e-9
);

// Viral outlier (bug: @aunnieonchain's one 127K-view post carried a 13.56% pooled rate)
const viralPost = (i: number, views: number, eng: number): Tweet => ({
  ...post(i),
  text: i === 0 ? 'the viral one' : `post ${i}`,
  public_metrics: {
    like_count: eng,
    retweet_count: 0,
    reply_count: 0,
    quote_count: 0,
    impression_count: views,
  },
});
const viral = analyzeTweets([
  viralPost(0, 127_000, 18_800),
  ...Array.from({ length: 9 }, (_, i) => viralPost(i + 1, 1000, 20)),
]);
test(
  'one viral post does not carry the rate (median 2%)',
  Math.abs(viral.stats.avgEngagementRate - 2) < 1e-9
);
test('pooled rate still reported, and much higher', viral.stats.pooledEngagementRate > 13);
test('median views = 1,000', viral.stats.medianViews === 1000);
test(
  'the viral post is called out: 127× the usual, its own id',
  viral.stats.outlier?.tweetId === '0' && viral.stats.outlier?.multiple === 127
);
test('no outlier when posts are alike', er.stats.outlier === null && a.stats.outlier === null);

console.log('E. Read summary on the card (bug: cut at a decimal point, "With 52.")');
test(
  'decimals stay intact',
  firstSentences(
    'Hades teaches branding. With 52.3K followers he hits 2.05% engagement. Third.',
    2
  ) === 'Hades teaches branding. With 52.3K followers he hits 2.05% engagement.'
);
test('first sentence only', firstSentences('One. Two. Three.', 1) === 'One.');
test('no period → whole text', firstSentences('Just one line', 2) === 'Just one line');
test(
  'question and exclamation marks end sentences',
  firstSentences('Is it good? Yes! More.', 2) === 'Is it good? Yes!'
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
