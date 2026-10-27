import type { HomeData } from '@/lib/home-data';
import { ago } from '@/lib/home-data';
import type { LookupStats } from '@/lib/lookups';
import type { MemberRecord, Phase } from '@/lib/growth-data';

/**
 * The growth dashboard's "your record" block from the member's own data:
 * account reads (oldest first), the last 5 scored posts, lookup counts.
 * Pure: the dashboard page loads the rows.
 */

const KEYS: [string, Phase][] = [
  ['Define', 'define'],
  ['Check', 'check'],
  ['Generate', 'generate'],
  ['Scale', 'scale'],
];

export function memberRecord(
  home: Pick<HomeData, 'handle' | 'scans' | 'posts'>,
  lookups: { week: LookupStats; today: LookupStats } | null
): MemberRecord {
  return {
    history: home.scans.map((s) => {
      const by = new Map((s.phases ?? []).map((p) => [p.key, p.value]));
      const phases = KEYS.every(([label]) => by.has(label))
        ? (Object.fromEntries(KEYS.map(([label, k]) => [k, by.get(label)!])) as Record<
            Phase,
            number
          >)
        : null;
      return { id: s.id, at: s.scannedAt.toISOString(), score: s.score, phases };
    }),
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
  };
}
