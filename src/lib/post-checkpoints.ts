import { Prisma } from '@prisma/client';
import prisma from '@/lib/db';

/**
 * Post look-back history (migration 050, docs/POST-LOOKBACK-SPEC.md).
 * AccountPost overwrites a post's numbers on every sync; this keeps a fixed
 * copy at set ages so a look-back can say "settled" and compare like with like.
 * Brands only, from data the nightly sync already fetched (no extra requests).
 */

export type Checkpoint = 'first' | '24h' | '48h';

const HOUR = 3_600_000;
// Nightly syncs land a "48h" capture at 48–72h; the slack covers a missed night.
const WINDOW_HOURS = 96;

export interface CheckpointPost {
  tweetId: string;
  postedAt: Date;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  bookmarks: number;
  views: number;
}

/** Checkpoints a post of this age is due (empty once it's past the window). */
export function dueCheckpoints(ageHours: number): Checkpoint[] {
  if (!(ageHours >= 0) || ageHours > WINDOW_HOURS) return [];
  const due: Checkpoint[] = ['first'];
  if (ageHours >= 24) due.push('24h');
  if (ageHours >= 48) due.push('48h');
  return due;
}

/** Rows to insert; existing (tweetId, checkpoint) pairs are kept as captured. */
export function checkpointRows(accountId: string, posts: CheckpointPost[], now: Date) {
  return posts.flatMap((p) => {
    const ageHours = (now.getTime() - p.postedAt.getTime()) / HOUR;
    return dueCheckpoints(ageHours).map((checkpoint) => ({
      accountId,
      tweetId: p.tweetId,
      checkpoint,
      capturedAt: now,
      ageHours: Math.round(ageHours * 10) / 10,
      likes: p.likes,
      replies: p.replies,
      reposts: p.reposts,
      quotes: p.quotes,
      bookmarks: p.bookmarks,
      views: p.views,
    }));
  });
}

/**
 * Best effort: never fails a sync. Skips quietly until migration 050 is
 * applied (P2021 = table does not exist).
 */
export async function captureCheckpoints(accountId: string, posts: CheckpointPost[]): Promise<number> {
  const data = checkpointRows(accountId, posts, new Date());
  if (!data.length) return 0;
  try {
    const r = await prisma.postMetricCheckpoint.createMany({ data, skipDuplicates: true });
    return r.count;
  } catch (e) {
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2021')) {
      console.error('[post-checkpoints]', accountId, e instanceof Error ? e.message : e);
    }
    return 0;
  }
}
