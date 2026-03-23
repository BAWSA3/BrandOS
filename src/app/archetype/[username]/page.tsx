import { Metadata } from 'next';
import { Suspense } from 'react';
import ArchetypeScanHero from '@/components/ArchetypeScanHero';

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const sp = await searchParams;
  const archetype = sp.a || 'ARC';
  const tier = sp.t || '1';
  const tierLabel = sp.tl || 'ENTRY';
  const displayName = sp.n || username;

  const title = `@${username} is ${archetype} | BrandOS Archetype`;
  const description = `${displayName} is THE ${archetype.toUpperCase()} — Tier ${tier} ${tierLabel}. Discover your Creator Archetype at mybrandos.app/archetype`;

  const ogUrl = new URL(
    '/api/og/archetype',
    process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app'
  );
  ogUrl.searchParams.set('u', username);
  ogUrl.searchParams.set('a', archetype);
  ogUrl.searchParams.set('t', tier);
  ogUrl.searchParams.set('tl', tierLabel);
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

export default async function ArchetypeSharePage({ params }: PageProps) {
  const { username } = await params;

  return (
    <Suspense fallback={null}>
      <ArchetypeScanHero initialUsername={username} autoStart />
    </Suspense>
  );
}
