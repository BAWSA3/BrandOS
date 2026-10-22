/**
 * Score consistency rules (src/lib/score-smoothing.ts). Pure, no network/DB:
 *   npm run test:scores
 */
import { maxDrift, smoothScore } from '../src/lib/score-smoothing';

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

const NOW = new Date('2026-10-22T12:00:00Z');
const ago = (days: number) => new Date(NOW.getTime() - days * 86_400_000);

console.log('A. Drift allowance grows with time since the last scan');
test('same week → ±3', maxDrift(2) === 3);
test('same month → ±5', maxDrift(20) === 5);
test('months later → ±12', maxDrift(200) === 12);

console.log('B. Clamping');
test('first scan (nothing stored) → raw', smoothScore(66, null, NOW) === 66);
test(
  'next-day rescan 74 → 66 is held to 71',
  smoothScore(66, { score: 74, scannedAt: ago(1) }, NOW) === 71
);
test(
  'next-day rescan 74 → 80 is held to 77',
  smoothScore(80, { score: 74, scannedAt: ago(1) }, NOW) === 77
);
test(
  'within the allowance → unchanged',
  smoothScore(76, { score: 74, scannedAt: ago(1) }, NOW) === 76
);
test(
  'March scanner (7 months) 62 → 75 is held to 74',
  smoothScore(75, { score: 62, scannedAt: ago(215) }, NOW) === 74
);
test(
  'March scanner 62 → 70 moves freely',
  smoothScore(70, { score: 62, scannedAt: ago(215) }, NOW) === 70
);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
