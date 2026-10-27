/**
 * Draft scoring, the measured half (src/lib/draft-signals.ts) and input
 * validation (src/lib/draft-score.ts validateDraft). Pure: no DB, no network,
 * no model calls.  npm run test:draft
 */
import {
  draftScore,
  draftSignals,
  historyNotes,
  historyStats,
  localHourLabel,
  topFixes,
  validateDraft,
  verdictOf,
} from '../src/lib/draft-signals';
import type { PostRow } from '../src/lib/growth-metrics';

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

const at = (h: number, day = 1) => new Date(Date.UTC(2026, 9, day, h, 0, 0));
function post(o: Partial<PostRow> & { views: number; likes: number }): PostRow {
  return {
    tweetId: String(Math.random()),
    text: 'a post about building in public',
    postedAt: at(14),
    replies: 0,
    reposts: 0,
    quotes: 0,
    bookmarks: 0,
    media: [],
    isQuote: false,
    ...o,
  };
}

// a member whose media posts do ~2.5× their text posts, best at 14:00 UTC
const history: PostRow[] = [
  ...Array.from({ length: 6 }, (_, i) =>
    post({ views: 1000 + i * 100, likes: 50, media: ['photo'], postedAt: at(14, i + 1) })
  ),
  ...Array.from({ length: 6 }, (_, i) =>
    post({ views: 900 + i * 50, likes: 18, postedAt: at(3, i + 1) })
  ),
];
const stats = historyStats(history);

console.log('\nA. History stats');
test('counts posts', stats.posts === 12, stats.posts);
test('median views', stats.medianViews > 900 && stats.medianViews < 1200, stats.medianViews);
test('peak hour is their best hour (14 UTC)', stats.peakHourUtc === 14, stats.peakHourUtc);
test('average rate is engagements ÷ views', stats.avgRate !== null && stats.avgRate > 0);

console.log('\nB. Signals for a text draft');
const noon = at(3); // posting at their worst hour
const s1 = draftSignals(
  { text: 'shipping a new feature today, here is what i learned', tzOffsetMin: 0 },
  stats,
  noon
);
test('format is text', s1.format === 'text', s1.format);
test('format lift below 1 for their weak format', (s1.formatLift ?? 9) < 1, s1.formatLift);
test(
  'suggests adding media, with their own multiple',
  s1.fixes.some((f) => /Add an image/.test(f.text) && /×/.test(f.text) && f.source === 'data'),
  s1.fixes
);
test(
  'suggests their best hour in their own time',
  s1.fixes.some((f) => /2pm/.test(f.text)),
  s1.fixes
);
test('reach band from their text posts', !!s1.reach && s1.reach.low <= s1.reach.high, s1.reach);

console.log('\nC. Signals for a media draft at their best hour');
const s2 = draftSignals(
  { text: 'shipping a new feature today, here is what i learned', hasMedia: true, tzOffsetMin: 0 },
  stats,
  at(14)
);
test('format is media', s2.format === 'media', s2.format);
test(
  'no "add an image" when media is attached',
  !s2.fixes.some((f) => /Add an image/.test(f.text))
);
test('no timing nudge at their best hour', !s2.fixes.some((f) => /engages most/.test(f.text)));
test('lift above 1', (s2.formatLift ?? 0) > 1, s2.formatLift);

console.log('\nD. Score and verdict');
test('media lift raises the score', draftScore(70, s2) > 70, draftScore(70, s2));
test('weak format lowers the score', draftScore(70, s1) < 70, draftScore(70, s1));
test('nudge is capped at ±8', draftScore(50, { formatLift: 100, overLimit: false }) === 58);
test('clamped to 0–100', draftScore(99, { formatLift: 4, overLimit: false }) === 100);
test(
  'no history = model fit unchanged',
  draftScore(66, { formatLift: null, overLimit: false }) === 66
);
test(
  'verdicts',
  verdictOf(85) === 'Ready to post' && verdictOf(65) === 'Close' && verdictOf(40) === 'Needs work'
);

console.log('\nE. Edge cases');
const long = 'x'.repeat(300);
const s3 = draftSignals({ text: long }, stats, at(14));
test(
  'over 280 (not a thread) is flagged',
  s3.overLimit && s3.fixes[0].text.includes('20 characters over'),
  s3.fixes
);
test(
  'over-limit costs points',
  draftScore(70, s3) <= draftScore(70, { ...s3, overLimit: false }) - 5
);
const thread = draftSignals({ text: `1/ ${'y'.repeat(300)}` }, stats, at(14));
test('a thread is not over the limit', thread.format === 'thread' && !thread.overLimit);
const fresh = draftSignals({ text: 'first ever post on here' }, historyStats([]), at(14));
test(
  'no history: no measured fixes, no reach band',
  fresh.fixes.length === 0 && fresh.reach === null
);
test('no history: no notes for the prompt', historyNotes(historyStats([])) === '');
test('notes mention their formats', /With media/.test(historyNotes(stats)));
const longLine = draftSignals({ text: 'z'.repeat(150) }, stats, at(14));
test(
  'long first line → open with the payoff',
  longLine.fixes.some((f) => /payoff/.test(f.text))
);

console.log('\nF. Fixes merge');
const merged = topFixes(
  [
    {
      text: 'Add an image: your posts with media engage 2.5× your text-only posts.',
      source: 'data',
    },
  ],
  [
    'Add an image: your posts with media engage more',
    'Name the tool you used',
    'End on a question',
  ],
  3
);
test('at most 3', merged.length === 3, merged);
test('measured fix first', merged[0].source === 'data');
test(
  'near-duplicate model fix dropped',
  merged.filter((f) => /Add an image/.test(f.text)).length === 1,
  merged
);

console.log('\nG. Time labels');
test('14 UTC at UTC = 2pm', localHourLabel(14, 0) === '2pm');
test('14 UTC in Los Angeles (−420) = 7am', localHourLabel(14, -420) === '7am');
test('2 UTC in Tokyo (+540) = 11am', localHourLabel(2, 540) === '11am');
test('midnight = 12am', localHourLabel(0, 0) === '12am');

console.log('\nH. Input validation');
const throws = (fn: () => unknown, status: number) => {
  try {
    fn();
    return false;
  } catch (e) {
    return (e as { status?: number }).status === status;
  }
};
test(
  'too short → 400',
  throws(() => validateDraft({ text: 'hi' }), 400)
);
test(
  'too long → 400',
  throws(() => validateDraft({ text: 'a'.repeat(2001) }), 400)
);
test(
  'non-string → 400',
  throws(() => validateDraft({ text: 42 }), 400)
);
test(
  'missing body → 400',
  throws(() => validateDraft(null), 400)
);
const ok = validateDraft({ text: '  a fine draft here  ', hasMedia: 'yes', tzOffsetMin: 99999 });
test('trims text', ok.text === 'a fine draft here');
test('hasMedia must be exactly true', ok.hasMedia === false);
test('absurd timezone → 0', ok.tzOffsetMin === 0);
test(
  'valid timezone kept',
  validateDraft({ text: 'a fine draft here', tzOffsetMin: -420 }).tzOffsetMin === -420
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
