import type { Metadata } from 'next';

const title = 'See Your Brand Score | BrandOS';
const description =
  'You read about building a brand with AI. Now see yours — get your Brand Score and discover your unique brand identity.';
const ogImageUrl = 'https://mybrandos.app/og-image.png';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
    url: 'https://mybrandos.app/article',
    siteName: 'BrandOS',
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'See Your Brand Score on BrandOS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [ogImageUrl],
    creator: '@BrandOS_xyz',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
