/**
 * First-run walkthrough rules (src/lib/walkthrough.ts): which steps show,
 * and that a thin read never produces an empty step.
 *   npx tsx scripts/test-walkthrough.ts
 */
import { walkthroughSteps, type WalkthroughInput } from '../src/lib/walkthrough';

let pass = 0;
let fail = 0;
function ok(cond: unknown, msg: string) {
  if (cond) pass++;
  else {
    fail++;
    console.log('FAIL', msg);
  }
}
const kinds = (d: WalkthroughInput) =>
  walkthroughSteps(d).map((s) => s.kind).join(',');

const full: WalkthroughInput = {
  handle: 'jbawsa',
  score: 71.6,
  classification: 'CLASS 04 / ARC',
  strengths: ['Breaking down token launches', 'Plain-language threads', '  ', 'Receipts', 'Extra'],
  working: [
    { label: 'Long posts', rate: 3.24, top: true },
    { label: 'Replies', rate: 1.1, top: false },
  ],
  gap: '  Your hooks bury the point.  ',
};

ok(kinds(full) === 'score,known,working,sharpen', 'full read shows all four steps in order');
const s = walkthroughSteps(full);
const score = s[0];
ok(score.kind === 'score' && score.score === 72, 'score is rounded');
ok(score.kind === 'score' && score.classification === 'CLASS 04 / ARC', 'classification carried');
const known = s[1];
ok(known.kind === 'known' && known.lines.length === 3, 'known for capped at 3, blanks dropped');
ok(known.kind === 'known' && !known.lines.includes(''), 'no blank known-for line');
const working = s[2];
ok(working.kind === 'working' && working.label === 'Long posts' && working.rate === 3.2, 'top format, one decimal');
ok(working.kind === 'working' && working.body.includes('3.2% of the people who see them'), 'rate in the sentence');
ok(working.kind === 'working' && !/follow/i.test(working.body), 'never claims the rate is followers');
const sharpen = s[3];
ok(sharpen.kind === 'sharpen' && sharpen.gap === 'Your hooks bury the point.', 'gap trimmed');

// thin reads
ok(kinds({ ...full, score: null }) === 'known,working,sharpen', 'no score: score step skipped');
ok(kinds({ ...full, score: Number.NaN }) === 'known,working,sharpen', 'NaN score skipped');
ok(kinds({ ...full, strengths: [] }) === 'score,working,sharpen', 'no strengths: known skipped');
ok(kinds({ ...full, strengths: [' ', ''] }) === 'score,working,sharpen', 'blank strengths: known skipped');
ok(kinds({ ...full, working: [] }) === 'score,known,sharpen', 'no formats: working skipped');
ok(
  kinds({ ...full, working: [{ label: 'Long posts', rate: 3, top: true }] }) === 'score,known,sharpen',
  'one format has nothing to beat: skipped'
);
ok(
  kinds({ ...full, working: [{ label: 'A', rate: 3, top: false }, { label: 'B', rate: 2, top: false }] }) ===
    'score,known,sharpen',
  'no top format: skipped'
);
ok(
  kinds({ ...full, working: [{ label: 'A', rate: 0, top: true }, { label: 'B', rate: 0, top: false }] }) ===
    'score,known,sharpen',
  'all-zero rates: skipped'
);
const noGap = walkthroughSteps({ ...full, gap: '   ' }).at(-1)!;
ok(noGap.kind === 'sharpen' && noGap.gap === null && noGap.body.startsWith('Nothing big'), 'no gap: keep going copy');
const bare = walkthroughSteps(
  { handle: 'x', score: null, classification: null, strengths: [], working: [], gap: null }
);
ok(bare.length === 1 && bare[0].kind === 'sharpen', 'empty read still has a step, never zero');

// copy rules: plain words, no hashtag advice
const all = JSON.stringify([walkthroughSteps(full), walkthroughSteps({ ...full, gap: null })]);
ok(!/hashtag/i.test(all), 'no hashtag talk');
ok(!/—/.test(all), 'no em dashes in copy');

console.log(`${pass}/${pass + fail} passed`);
if (fail) process.exit(1);
