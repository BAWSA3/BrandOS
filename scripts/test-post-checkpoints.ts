// Run: npm run test:post-checkpoints
import assert from 'node:assert/strict';
import { checkpointRows, dueCheckpoints } from '../src/lib/post-checkpoints';

let n = 0;
const t = (name: string, fn: () => void) => { fn(); n++; console.log('ok', name); };

t('fresh post: first only', () => assert.deepEqual(dueCheckpoints(3), ['first']));
t('day-old post: first + 24h', () => assert.deepEqual(dueCheckpoints(30), ['first', '24h']));
t('two-day-old post: all three', () => assert.deepEqual(dueCheckpoints(50), ['first', '24h', '48h']));
t('past the window: none', () => assert.deepEqual(dueCheckpoints(200), []));
t('future or bad dates: none', () => {
  assert.deepEqual(dueCheckpoints(-1), []);
  assert.deepEqual(dueCheckpoints(NaN), []);
});
t('rows carry numbers and real age', () => {
  const now = new Date('2026-10-29T12:00:00Z');
  const rows = checkpointRows('acc', [
    { tweetId: '1', postedAt: new Date('2026-10-28T10:00:00Z'), likes: 5, replies: 1, reposts: 0, quotes: 0, bookmarks: 2, views: 900 },
    { tweetId: '2', postedAt: new Date('2026-10-01T10:00:00Z'), likes: 9, replies: 0, reposts: 0, quotes: 0, bookmarks: 0, views: 50 },
  ], now);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((r) => r.checkpoint), ['first', '24h']);
  assert.equal(rows[0].ageHours, 26);
  assert.equal(rows[0].views, 900);
});
console.log(`${n} passed`);
