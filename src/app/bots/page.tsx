import type { Metadata } from 'next';
import { cleanBotHandle } from '@/lib/bot-rules';
import BotCheck from './BotCheck';

// "How many bots follow you?" — the public bot check. Same experience as the
// Verified campaign video ("The Check"): scan bar → the question → follower
// count → every sampled follower checked → % real → who engages → sign up.
// Shared links (/bots?h=handle) unfurl with that handle's result.

type Props = { searchParams: Promise<{ h?: string }> };

const APP = process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const handle = cleanBotHandle((await searchParams).h);
  const title = handle
    ? `How many bots follow @${handle}? · BrandOS`
    : 'How many bots follow you? · BrandOS';
  const description =
    'Check any X account free: BrandOS reads the newest 200 followers and the people who engage, and shows how many look real.';
  const image = `${APP}/api/og/bots${handle ? `?h=${handle.toLowerCase()}` : ''}`;
  const url = `${APP}/bots${handle ? `?h=${handle}` : ''}`;
  return {
    title,
    description,
    openGraph: { title, description, images: [image], url },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function BotsPage({ searchParams }: Props) {
  const handle = cleanBotHandle((await searchParams).h);
  return <BotCheck initialHandle={handle} />;
}
