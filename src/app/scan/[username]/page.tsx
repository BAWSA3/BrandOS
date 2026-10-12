import { Metadata } from 'next';
import ScanPageClient from './ScanPageClient';
import { getPublicScan } from '@/lib/public-scan';

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  // Real result from our scan log; the URL's score params are never trusted
  // for the preview (they could be edited into a fake score).
  const scan = await getPublicScan(username);
  const handle = scan?.handle ?? username.replace(/^@/, '').toLowerCase();
  const title = scan
    ? `@${handle} scored ${scan.score}/100 on BrandOS`
    : `What's @${handle}'s brand score? · BrandOS`;
  const description = scan
    ? `${scan.name} is THE ${(scan.archetype ?? 'Unknown').toUpperCase()}.${
        scan.phases
          ? ` Brand DNA: DEFINE ${scan.phases.define} | CHECK ${scan.phases.check} | GENERATE ${scan.phases.generate} | SCALE ${scan.phases.scale}.`
          : ''
      } Get your free brand score at mybrandos.app`
    : 'Get your free brand score at mybrandos.app';

  const ogUrl = new URL('/api/og', process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app');
  ogUrl.searchParams.set('u', handle);

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

export default async function ScanPage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const sp = await searchParams;

  const scoreData = {
    username,
    displayName: sp.n || username,
    score: parseInt(sp.s || '0'),
    archetype: sp.a || 'Unknown',
    define: parseInt(sp.d || '0'),
    check: parseInt(sp.c || '0'),
    generate: parseInt(sp.g || '0'),
    scale: parseInt(sp.sc || '0'),
  };

  return <ScanPageClient data={scoreData} />;
}
