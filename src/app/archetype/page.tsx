import { Metadata } from 'next';
import { Suspense } from 'react';
import ArchetypeScanHero from '@/components/ArchetypeScanHero';

export const metadata: Metadata = {
  title: 'Discover Your Creator Archetype | BrandOS',
  description:
    'Every creator falls into one of 8 archetypes. Enter your X handle to discover yours — ARC, ENTROPY, NULL, FREQ, RELAY, BUILD.EXE, SOURCE, or FORESIGHT.',
  openGraph: {
    title: 'Discover Your Creator Archetype | BrandOS',
    description:
      'Every creator falls into one of 8 archetypes. Enter your X handle to discover yours.',
    images: [{ url: '/og-archetype.png', width: 1200, height: 630 }],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Discover Your Creator Archetype | BrandOS',
    description:
      'Every creator falls into one of 8 archetypes. Enter your X handle to discover yours.',
  },
};

export default function ArchetypePage() {
  return (
    <Suspense fallback={null}>
      <ArchetypeScanHero />
    </Suspense>
  );
}
