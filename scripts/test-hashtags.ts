/**
 * BrandOS never pitches hashtag strategy (src/lib/no-hashtag-advice.ts) and
 * the scan output filter (parseBrandScore). Pure, no network/DB:
 *   npm run test:hashtags
 */
import {
  dropHashtagAdvice,
  mentionsHashtags,
  stripHashtagSentences,
} from '../src/lib/no-hashtag-advice';
import { parseBrandScore } from '../src/lib/score-schemas';

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

console.log('mentionsHashtags');
test('"hashtags"', mentionsHashtags('Use 2-3 niche hashtags per post'));
test('"hash-tag"', mentionsHashtags('a smarter hash-tag mix'));
test('a #tag', mentionsHashtags('add #web3 to your posts'));
test('#1 is not a tag', !mentionsHashtags('ranked #1 this week'));
test('"Day #X" is not a tag', !mentionsHashtags('like your Day #X trading updates'));
test('plain advice', !mentionsHashtags('Turn your best post into a thread or an Article'));

console.log('dropHashtagAdvice');
const list = [
  'Post a weekly breakdown',
  'Use more relevant hashtags to boost reach',
  'Reply to bigger accounts',
];
test(
  'drops only the hashtag item',
  JSON.stringify(dropHashtagAdvice(list)) === JSON.stringify([list[0], list[2]])
);
test('non-arrays pass through', dropHashtagAdvice('x' as unknown) === 'x');

console.log('stripHashtagSentences');
test(
  'cuts only the hashtag sentence',
  stripHashtagSentences('Strong voice. Hashtag use is inconsistent. Posts land.') ===
    'Strong voice. Posts land.'
);
test('untouched when clean', stripHashtagSentences('Strong voice.') === 'Strong voice.');

console.log('parseBrandScore drops hashtag advice from model output');
const phase = (insights: string[]) => ({ score: 70, insights });
const out = parseBrandScore(
  JSON.stringify({
    overallScore: 72,
    phases: {
      define: { ...phase(['Clear niche']), contentIdentity: {} },
      check: phase(['Consistent voice']),
      generate: phase(['Good media use', 'Underuses hashtags']),
      scale: phase(['Healthy ratio']),
    },
    topStrengths: ['Smart hashtag strategy', 'Authentic voice'],
    topImprovements: ['Add 3-5 hashtags per post', 'Go deeper on your best ideas'],
    nextMoves: ['Research trending #crypto tags', 'Start a weekly series'],
    contentPillars: ['Gaming'],
    summary: 'A clear gaming voice. More hashtags would help discovery.',
    archetype: {
      primary: 'FREQ',
      emoji: 'x',
      tagline: 't',
      description: 'd',
      strengths: ['Hashtag savvy', 'Funny'],
      growthTip: 'Lean into series. Try trending hashtags.',
    },
    influenceTier: 'emerging',
  })
) as Record<string, any> | null;
test('parsed', !!out);
test('strengths', JSON.stringify(out?.topStrengths) === '["Authentic voice"]');
test('improvements', JSON.stringify(out?.topImprovements) === '["Go deeper on your best ideas"]');
test('next moves', JSON.stringify(out?.nextMoves) === '["Start a weekly series"]');
test('phase insights', JSON.stringify(out?.phases.generate.insights) === '["Good media use"]');
test('summary sentence cut', out?.summary === 'A clear gaming voice.');
test('archetype strengths', JSON.stringify(out?.archetype.strengths) === '["Funny"]');
test('growth tip sentence cut', out?.archetype.growthTip === 'Lean into series.');
test('scores untouched', out?.overallScore === 72);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exit(1);
