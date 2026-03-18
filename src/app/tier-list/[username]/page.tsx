import { Metadata } from 'next';
import { getTierListData } from '@/lib/tier-list';
import TierRankClient from './TierRankClient';

interface PageProps {
  params: Promise<{ username: string }>;
}

export const revalidate = 21600;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const { tierUsers } = await getTierListData();

  const userIndex = tierUsers.findIndex(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );

  if (userIndex === -1) {
    return { title: 'Creator Not Found — BrandOS Tier List' };
  }

  const user = tierUsers[userIndex];
  const rank = userIndex + 1;
  const total = tierUsers.length;
  const percentile = Math.round((1 - (rank - 1) / total) * 100);
  const tierName =
    user.score >= 80 ? 'ELITE' : user.score >= 60 ? 'STRONG' : 'RISING';

  const title = `@${user.username} is ranked #${rank} on the BrandOS Tier List`;
  const description = `Score: ${user.score}/100 | Tier: ${tierName} | ${user.archetype ? `Archetype: THE ${user.archetype.toUpperCase()} | ` : ''}Top ${percentile}% of ${total.toLocaleString()} creators`;

  const ogUrl = new URL(
    '/api/og/tier-rank',
    process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app'
  );
  ogUrl.searchParams.set('u', user.username);
  ogUrl.searchParams.set('s', String(user.score));
  ogUrl.searchParams.set('a', user.archetype || '');
  ogUrl.searchParams.set('r', String(rank));
  ogUrl.searchParams.set('t', String(total));
  if (user.profileImageUrl) {
    ogUrl.searchParams.set('pfp', user.profileImageUrl);
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: ogUrl.toString(), width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogUrl.toString()],
    },
  };
}

export default async function TierRankPage({ params }: PageProps) {
  const { username } = await params;
  const { tierUsers } = await getTierListData();

  const userIndex = tierUsers.findIndex(
    (u) => u.username.toLowerCase() === username.toLowerCase()
  );

  if (userIndex === -1) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <h1
            className="text-2xl font-bold mb-4 text-white/80"
            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
          >
            CREATOR NOT FOUND
          </h1>
          <p
            className="text-white/40 text-sm mb-6"
            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
          >
            @{username} hasn&apos;t been scanned yet.
          </p>
          <a
            href="/"
            className="inline-block bg-[#0047FF] hover:bg-[#0035cc] text-white font-bold px-6 py-3 rounded text-[11px] tracking-[0.1em] transition-colors"
            style={{ fontFamily: "'VCR OSD Mono', monospace" }}
          >
            {'>'} SCAN_YOUR_BRAND
          </a>
        </div>
      </div>
    );
  }

  const user = tierUsers[userIndex];
  const rank = userIndex + 1;
  const total = tierUsers.length;
  const percentile = Math.round((1 - (rank - 1) / total) * 100);
  const tierName =
    user.score >= 80 ? 'ELITE' : user.score >= 60 ? 'STRONG' : 'RISING';
  const tierColor =
    user.score >= 80 ? '#0047FF' : user.score >= 60 ? '#10B981' : '#F59E0B';

  return (
    <TierRankClient
      username={user.username}
      score={user.score}
      archetype={user.archetype}
      profileImageUrl={user.profileImageUrl}
      rank={rank}
      totalUsers={total}
      percentile={percentile}
      tierName={tierName}
      tierColor={tierColor}
    />
  );
}
