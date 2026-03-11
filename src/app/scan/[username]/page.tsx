import { Metadata } from 'next';
import ScanPageClient from './ScanPageClient';

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const sp = await searchParams;
  const score = sp.s || '0';
  const archetype = sp.a || 'Unknown';
  const define = sp.d || '0';
  const check = sp.c || '0';
  const generate = sp.g || '0';
  const scale = sp.sc || '0';
  const displayName = sp.n || username;

  const title = `@${username} scored ${score}/100 on BrandOS`;
  const description = `${displayName} is THE ${archetype.toUpperCase()}. Brand DNA: DEFINE ${define} | CHECK ${check} | GENERATE ${generate} | SCALE ${scale}. Get your free brand score at mybrandos.app`;

  const ogUrl = new URL('/api/og', process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app');
  ogUrl.searchParams.set('u', username);
  ogUrl.searchParams.set('s', score);
  ogUrl.searchParams.set('a', archetype);
  ogUrl.searchParams.set('d', define);
  ogUrl.searchParams.set('c', check);
  ogUrl.searchParams.set('g', generate);
  ogUrl.searchParams.set('sc', scale);
  ogUrl.searchParams.set('n', displayName);

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
