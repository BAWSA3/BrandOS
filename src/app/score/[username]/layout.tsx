import type { Metadata } from 'next';

interface Props {
  params: Promise<{ username: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const cleanUsername = username.replace(/^@/, '');
  
  const title = `@${cleanUsername}'s Brand Score | BrandOS`;
  const description = `See @${cleanUsername}'s Brand DNA analysis. Get your own Brand Score and discover your unique brand identity.`;
  
  // Dynamic OG image URL - points to a route that generates the image
  // For now, we'll use a static OG image with the branding
  const ogImageUrl = `https://mybrandos.app/og-image.png`;
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `https://mybrandos.app/score/${cleanUsername}`,
      siteName: 'BrandOS',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `@${cleanUsername}'s Brand Score on BrandOS`,
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
}

export default function ScoreUsernameLayout({ children }: Props) {
  return children;
}
