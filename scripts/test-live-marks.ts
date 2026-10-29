/**
 * Live composer marks (src/lib/live-marks.ts), the milestone reveal and the
 * scripted film. Pure: no DB, no network, no model calls.  npm run test:live-marks
 */
import {
  anchorQuotes,
  buildVoiceProfile,
  localMarks,
  matchIdea,
  mergeMarks,
  parseLiveRead,
  parseModelMarks,
  segments,
  shapeOf,
} from '../src/lib/live-marks';
import { reveal } from '../src/components/live-composer/reveal';
import {
  demoStateAt,
  keystrokes,
  SAMPLE_SCRIPT,
  SAMPLE_TEXT,
  settledAt,
  THIN_SCRIPT,
} from '../src/components/live-composer/demo';

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

const posts = [
  'i asked 40 brands why they skip creators. here is what they said',
  'brands don’t read bios. they read your last ten posts.',
  'ten seconds on a profile. that’s the audition.',
  'receipts beat vibes every time',
  'shipped the composer today. it reads while you write.',
  'most creators are invisible to brands. not because they’re bad.',
];
const p = buildVoiceProfile(posts);
console.log('profile');
test('lowercase writer', p.lowercase >= 0.8, p.lowercase);
test('no emoji/exclaim/em dash', p.emoji === 0 && p.exclaim === 0 && p.emDash === 0);
test('short sentences', p.sentenceWords > 3 && p.sentenceWords < 12, p.sentenceWords);

console.log('tier 0');
const m1 = localMarks('Excited to announce our new thing!', p);
test(
  'capital start marked',
  m1.some((m) => m.note.includes('lowercase')),
  m1
);
test(
  'exclamation marked',
  m1.some((m) => m.note.includes('exclamation'))
);
test(
  'stock phrase marked',
  m1.some((m) => m.note.includes('isn’t a phrase'))
);
test(
  'all voice lens',
  m1.every((m) => m.lens === 'voice')
);
test(
  'spans in range',
  m1.every((m) => m.start >= 0 && m.end <= 34 && m.end > m.start)
);
test(
  'clean draft has no marks',
  localMarks('brands read your last ten posts. that’s it.', p).length === 0
);
test(
  'off below 5 posts',
  localMarks('Excited!', buildVoiceProfile(posts.slice(0, 3))).length === 0
);
test('hashtags never marked', localMarks('#buildinpublic ten posts', p).length === 0);

console.log('anchoring');
const quotes = [
  { lens: 'lane' as const, quote: 'my morning routine', note: 'off lane' },
  { lens: 'voice' as const, quote: 'gone', note: 'x' },
];
const a = anchorQuotes('brands, then my morning routine', quotes);
test('quote anchored', a.length === 1 && a[0].start === 13 && a[0].end === 31, a);
test('stale quote dropped after edit', anchorQuotes('brands only', quotes).length === 0);
const merged = mergeMarks(
  [{ id: 'l', start: 0, end: 6, lens: 'voice', note: '', source: 'local' }],
  [
    { id: 'm', start: 3, end: 9, lens: 'lane', note: '', source: 'model' },
    { id: 'n', start: 10, end: 12, lens: 'landing', note: '', source: 'model' },
  ],
  false
);
test(
  'overlap removed, local wins, landing hidden when thin',
  merged.length === 1 && merged[0].id === 'l',
  merged
);
test(
  'segments rebuild the text',
  segments('abcdefgh', merged)
    .map((s) => s.text)
    .join('') === 'abcdefgh'
);

console.log('model output guards');
const draft = 'honestly it changed how i post';
const parsed = parseModelMarks(
  {
    marks: [
      { lens: 'voice', quote: 'honestly', note: 'You never hedge.' },
      { lens: 'lane', quote: 'not in draft', note: 'x' },
      { lens: 'voice', quote: 'changed', note: 'Try "shifted" instead.' },
      { lens: 'lane', quote: 'post', note: 'Add a hashtag to reach more people.' },
      { lens: 'weird', quote: 'how', note: 'x' },
    ],
  },
  draft
);
test(
  'only real quotes, no rewrites, no hashtag talk, known lenses',
  parsed.length === 1 && parsed[0].quote === 'honestly',
  parsed
);
const lr = parseLiveRead({ score: 140, pillar: 9, marks: [] }, draft, 3);
test('score clamped, bad pillar dropped', lr.score === 100 && lr.pillar === null, lr);

console.log('shape + idea');
test('question shape', shapeOf('why do brands skip you? because') === 'question');
test('thread shape', shapeOf('1/5 here is how') === 'thread');
const idea = matchIdea('i asked 40 brands why they skip creators', SAMPLE_SCRIPT.ideas);
test('idea matched', idea?.id === 'i1', idea);
test(
  'no idea for unrelated text',
  matchIdea('my morning coffee routine today', SAMPLE_SCRIPT.ideas) === null
);

console.log('film');
const k1 = keystrokes(SAMPLE_SCRIPT);
const k2 = keystrokes(SAMPLE_SCRIPT);
test('deterministic', JSON.stringify(k1) === JSON.stringify(k2));
const { L1, L2, L3 } = SAMPLE_TEXT;
const final = demoStateAt(SAMPLE_SCRIPT, settledAt(SAMPLE_SCRIPT, L1 + L2 + L3));
test(
  'film ends on the full draft, clean, 91',
  final.text === L1 + L2 + L3 && final.score === 91 && final.marks.length === 0,
  final
);
test('film ends with proof + idea', !!final.proof && final.idea?.id === 'i1');
const opening = demoStateAt(SAMPLE_SCRIPT, settledAt(SAMPLE_SCRIPT, 'Excited to announce'));
test(
  'opening shows a voice mark',
  opening.marks.some((m) => m.lens === 'voice'),
  opening.marks
);
const thin = demoStateAt(THIN_SCRIPT, settledAt(THIN_SCRIPT, L1 + L2 + L3));
test('thin: no proof, no landing', thin.proof === null && !thin.landingReady);

console.log('reveal (milestones)');
test(
  'all on at the end',
  reveal(final).score === 1 && reveal(final).proof === 1 && reveal(final).playbookLit
);
test(
  'nothing while typing the first words',
  reveal({ ...final, text: 'i asked', typing: true }).marks.voice === 0
);
test(
  'a pause after 3 words opens voice',
  reveal({ ...final, text: 'Excited to announce', typing: false }).marks.voice === 1
);
const hook = demoStateAt(SAMPLE_SCRIPT, settledAt(SAMPLE_SCRIPT, L1));
test(
  'hook: score + lane on, landing + proof still closed',
  reveal(hook).score === 1 &&
    reveal(hook).marks.lane === 1 &&
    reveal(hook).marks.landing === 0 &&
    reveal(hook).proof === 0,
  reveal(hook)
);
test('playbook line lights only with enough text', !reveal(hook).playbookLit);

test(
  'hook stays done through the space after the period',
  reveal({ ...hook, text: SAMPLE_TEXT.L1 + ' ', typing: true }).score === 1
);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
