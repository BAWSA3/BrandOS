import { Metadata } from 'next';
import BrandCardClient from './BrandCardClient';

interface PageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username } = await params;
  const clean = username.toLowerCase().replace(/^@/, '');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';

  return {
    title: `@${clean} — Brand Identity Card | BrandOS`,
    description: `See @${clean}'s creator archetype, brand score, and phase breakdown on BrandOS.`,
    openGraph: {
      title: `@${clean}'s Brand Identity Card`,
      description: `See @${clean}'s creator archetype, brand score, and phase breakdown on BrandOS.`,
      images: [`${appUrl}/api/og?u=${clean}`],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title: `@${clean}'s Brand Identity Card`,
      description: `See @${clean}'s creator archetype, brand score, and phase breakdown on BrandOS.`,
      images: [`${appUrl}/api/og?u=${clean}`],
    },
  };
}

export default async function BrandCardPage({ params }: PageProps) {
  const { username } = await params;
  return <BrandCardClient username={username.toLowerCase().replace(/^@/, '')} />;
}
