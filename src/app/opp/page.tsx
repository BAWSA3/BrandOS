import { Metadata } from 'next';
import OppPageClient from './OppPageClient';

interface PageProps {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const sp = await searchParams;
  const u1 = sp.u1;
  const u2 = sp.u2;

  // Dynamic metadata for shared matchup links
  if (u1 && u2) {
    const s1 = sp.s1 || '0';
    const s2 = sp.s2 || '0';
    const a1 = sp.a1 || 'Unknown';
    const a2 = sp.a2 || 'Unknown';

    const title = `@${u1} vs @${u2} — BrandOS Opp Matchup`;
    const description = `@${u1} (${s1}) vs @${u2} (${s2}). THE ${a1.toUpperCase()} vs THE ${a2.toUpperCase()}. Who has the stronger brand DNA? Find your opp at mybrandos.app/opp`;

    const ogUrl = new URL(
      '/api/og/opp',
      process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app'
    );
    ogUrl.searchParams.set('u1', u1);
    ogUrl.searchParams.set('u2', u2);
    ogUrl.searchParams.set('s1', s1);
    ogUrl.searchParams.set('s2', s2);
    ogUrl.searchParams.set('a1', a1);
    ogUrl.searchParams.set('a2', a2);
    if (sp.d1) ogUrl.searchParams.set('d1', sp.d1);
    if (sp.d2) ogUrl.searchParams.set('d2', sp.d2);
    if (sp.c1) ogUrl.searchParams.set('c1', sp.c1);
    if (sp.c2) ogUrl.searchParams.set('c2', sp.c2);
    if (sp.g1) ogUrl.searchParams.set('g1', sp.g1);
    if (sp.g2) ogUrl.searchParams.set('g2', sp.g2);
    if (sp.sc1) ogUrl.searchParams.set('sc1', sp.sc1);
    if (sp.sc2) ogUrl.searchParams.set('sc2', sp.sc2);

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

  // Static metadata for the landing page
  return {
    title: 'Find Your Opp | BrandOS',
    description:
      'Everyone has an opp on X. Enter your handle and your rival — BrandOS will tell you who cooks. Free brand DNA matchup.',
    openGraph: {
      title: 'Find Your Opp | BrandOS',
      description: 'Everyone has an opp on X. Who cooks harder? Find out free.',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Find Your Opp | BrandOS',
      description: 'Everyone has an opp on X. Who cooks harder? Find out free.',
    },
  };
}

export default async function OppPage() {
  return <OppPageClient />;
}
