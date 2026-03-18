import prisma from '@/lib/db';
import { Metadata } from 'next';
import TierListClient from './TierListClient';

export const metadata: Metadata = {
  title: 'BrandOS Tier List — Where Do You Rank?',
  description:
    'Every creator ranked by their Brand DNA Score. Find yourself on the tier list or scan yours now.',
};

// Revalidate every 6 hours
export const revalidate = 21600;

interface TierUser {
  username: string;
  score: number;
  archetype: string | null;
  profileImageUrl: string | null;
}

const BOT_PATTERNS = [
  /^bot_/i,
  /bot$/i,
  /_bot_/i,
  /^test/i,
  /^fake/i,
  /^spam/i,
  /\d{8,}/,
];

export default async function TierListPage() {
  // Fetch all scans
  const scans = await prisma.brandScans.findMany({
    orderBy: { score: 'desc' },
  });

  // Dedupe by username — keep highest score
  const userMap = new Map<string, (typeof scans)[0]>();
  for (const scan of scans) {
    const key = scan.username.toLowerCase();
    if (!userMap.has(key)) {
      userMap.set(key, scan);
    }
  }

  // Get cached profile pictures
  const cachedProfiles = await prisma.xProfileCache.findMany();
  const profileMap = new Map<string, string>();

  for (const profile of cachedProfiles) {
    try {
      const data = JSON.parse(profile.profileData);
      const pfp =
        data.profileImageUrl ||
        data.profile_image_url ||
        data.avatar ||
        null;
      if (pfp) {
        profileMap.set(
          profile.username.toLowerCase(),
          pfp.replace('_normal', '_400x400')
        );
      }
    } catch {
      // skip
    }
  }

  // Build tier users, filter bots and low scores
  const tierUsers: TierUser[] = [];

  for (const [username, scan] of userMap) {
    const isBot = BOT_PATTERNS.some((p) => p.test(username));
    if (isBot || scan.score < 40) continue;

    tierUsers.push({
      username,
      score: scan.score,
      archetype: scan.archetype,
      profileImageUrl: profileMap.get(username) || null,
    });
  }

  const tiers = {
    elite: tierUsers
      .filter((u) => u.score >= 80)
      .sort((a, b) => b.score - a.score),
    strong: tierUsers
      .filter((u) => u.score >= 60 && u.score < 80)
      .sort((a, b) => b.score - a.score),
    rising: tierUsers
      .filter((u) => u.score >= 40 && u.score < 60)
      .sort((a, b) => b.score - a.score),
  };

  return <TierListClient tiers={tiers} />;
}
