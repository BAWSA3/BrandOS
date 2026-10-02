import { unstable_cache } from 'next/cache';
import prisma from '@/lib/db';

export interface TierUser {
  username: string;
  score: number;
  archetype: string | null;
  profileImageUrl: string | null;
}

const BOT_PATTERNS = [/^bot_/i, /bot$/i, /_bot_/i, /^test/i, /^fake/i, /^spam/i, /\d{8,}/];

const EMPTY_TIERS = {
  tierUsers: [] as TierUser[],
  tiers: {
    elite: [] as TierUser[],
    strong: [] as TierUser[],
    rising: [] as TierUser[],
  },
};

const MIN_TIER_SCORE = 40;
const TIER_LIST_REVALIDATE_SECONDS = 21600; // 6 hours, matches the pages' ISR window

// Egress: this used to read every column of every BrandScans row plus the whole
// XProfileCache table on each call — and /tier-list/[username] called it twice
// per render, once per creator page. That full-table read per crawled page is
// what blew through the Supabase egress quota. Now: only the columns we use,
// only rows that can make the list, and one shared cached result across pages.
// Throws on DB failure so an empty outage result is never cached.
const loadTierListData = unstable_cache(
  async () => {
    const scans = await prisma.brandScans.findMany({
      where: { score: { gte: MIN_TIER_SCORE } },
      orderBy: { score: 'desc' },
      select: { username: true, score: true, archetype: true },
    });

    // Dedupe by username — keep highest score
    const userMap = new Map<string, (typeof scans)[0]>();
    for (const scan of scans) {
      const key = scan.username.toLowerCase();
      if (!userMap.has(key)) {
        userMap.set(key, scan);
      }
    }

    const cachedProfiles = await prisma.xProfileCache.findMany({
      where: { username: { in: [...userMap.keys()] } },
      select: { username: true, profileData: true },
    });

    return buildTiers(userMap, cachedProfiles);
  },
  ['tier-list-data'],
  { revalidate: TIER_LIST_REVALIDATE_SECONDS, tags: ['tier-list'] }
);

export async function getTierListData() {
  // The DB can be briefly unreachable (e.g. during a build-time prerender
  // before Supabase has fully woken up). Don't let that fail the whole build —
  // return empty tiers and let ISR backfill once the DB is reachable.
  try {
    return await loadTierListData();
  } catch (error) {
    console.error('[tier-list] Database unavailable; returning empty tiers:', error);
    return EMPTY_TIERS;
  }
}

function buildTiers(
  userMap: Map<string, { username: string; score: number; archetype: string | null }>,
  cachedProfiles: { username: string; profileData: string }[]
) {
  // Get cached profile pictures
  const profileMap = new Map<string, string>();

  for (const profile of cachedProfiles) {
    try {
      const data = JSON.parse(profile.profileData);
      const pfp = data.profileImageUrl || data.profile_image_url || data.avatar || null;
      if (pfp) {
        // Use _200x200 instead of _400x400 — more reliably available on Twitter CDN
        // Also strip any existing size suffix first to normalize
        const normalized = pfp.replace(/_(?:normal|bigger|mini|200x200|400x400)\./i, '_200x200.');
        profileMap.set(profile.username.toLowerCase(), normalized);
      }
    } catch {
      // skip
    }
  }

  // Build tier users, filter bots and low scores
  const tierUsers: TierUser[] = [];

  for (const [username, scan] of userMap) {
    const isBot = BOT_PATTERNS.some((p) => p.test(username));
    if (isBot || scan.score < MIN_TIER_SCORE) continue;

    tierUsers.push({
      username,
      score: scan.score,
      archetype: scan.archetype,
      profileImageUrl: profileMap.get(username) || null,
    });
  }

  // Sort by score descending
  tierUsers.sort((a, b) => b.score - a.score);

  const tiers = {
    elite: tierUsers.filter((u) => u.score >= 80),
    strong: tierUsers.filter((u) => u.score >= 60 && u.score < 80),
    rising: tierUsers.filter((u) => u.score >= 40 && u.score < 60),
  };

  return { tierUsers, tiers };
}
