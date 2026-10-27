import type { HomeData } from '@/lib/home-data';
import { ago } from '@/lib/home-data';
import type { LookupStats } from '@/lib/lookups';
import type { MemberRecord, Phase } from '@/lib/growth-data';
import { explainMove, type ReadPoint } from '@/lib/score-moves';
import { growthProof, type ProofSnapshot } from '@/lib/growth-proof';

/**
 * The growth dashboard's "your record" block from the member's own data:
 * account reads (oldest first), the last 5 scored posts, lookup counts, why
 * the score last moved and the "since you joined" line.
 * Pure: the dashboard page loads the rows.
 */

const KEYS: [string, Phase][] = [
  ['Define', 'define'],
  ['Check', 'check'],
  ['Generate', 'generate'],
  ['Scale', 'scale'],
];
const DAY_MS = 86_400_000;

/** Followers on the snapshot day closest to `at`. */
function followersAt(snaps: ProofSnapshot[], at: Date): number | null {
  if (!snaps.length) return null;
  const near = snaps.reduce((a, s) =>
    Math.abs(s.day.getTime() - at.getTime()) < Math.abs(a.day.getTime() - at.getTime()) ? s : a
  );
  return Math.abs(near.day.getTime() - at.getTime()) <= 2 * DAY_MS ? near.followers : null;
}

export function memberRecord(
  home: Pick<HomeData, 'handle' | 'scans' | 'posts'>,
  lookups: { week: LookupStats; today: LookupStats } | null,
  extra: {
    joinedAt?: Date;
    /** The member's own brand's daily snapshots (any order). */
    snapshots?: ProofSnapshot[];
    /** Posts scored 80+ since joining. */
    onBrandPosts?: number;
  } = {}
): MemberRecord {
  const history = home.scans.map((s) => {
    const by = new Map((s.phases ?? []).map((p) => [p.key, p.value]));
    const phases = KEYS.every(([label]) => by.has(label))
      ? (Object.fromEntries(KEYS.map(([label, k]) => [k, by.get(label)!])) as Record<Phase, number>)
      : null;
    return { id: s.id, at: s.scannedAt.toISOString(), score: s.score, phases };
  });

  const snaps = extra.snapshots ?? [];
  const reads: ReadPoint[] = history.map((h) => ({ ...h, at: new Date(h.at) }));
  let followersDelta: number | null = null;
  if (reads.length >= 2) {
    const a = followersAt(snaps, reads[reads.length - 2].at);
    const b = followersAt(snaps, reads[reads.length - 1].at);
    followersDelta = a !== null && b !== null ? b - a : null;
  }
  const move = explainMove(
    reads,
    home.posts.map((p) => ({
      tweetId: p.tweetId,
      postedAt: p.postedAt,
      fit: p.fit,
      multiple: p.multiple,
      excerpt: p.excerpt,
    })),
    { followersDelta }
  );

  return {
    history,
    posts: home.posts.slice(0, 5).map((p) => ({
      id: p.id,
      excerpt: p.excerpt,
      when: ago(p.postedAt),
      fit: p.fit,
      likes: p.likes,
      multiple: p.multiple ? `${p.multiple.toFixed(1)}x` : '—',
      breakdown: p.breakdown,
      url: `https://x.com/${home.handle}/status/${p.tweetId}`,
    })),
    lookups: lookups
      ? {
          week: {
            total: lookups.week.total,
            page: lookups.week.page,
            mcp: lookups.week.mcp,
            compare: lookups.week.compare,
          },
          today: lookups.today.total,
        }
      : null,
    move,
    proof: extra.joinedAt ? growthProof(extra.joinedAt, snaps, extra.onBrandPosts ?? 0) : null,
  };
}
