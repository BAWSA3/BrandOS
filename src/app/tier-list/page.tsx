import { Metadata } from 'next';
import { getTierListData } from '@/lib/tier-list';
import TierListClient from './TierListClient';

export const metadata: Metadata = {
  title: 'BrandOS Tier List — Where Do You Rank?',
  description:
    'Every creator ranked by their Brand DNA Score. Find yourself on the tier list or scan yours now.',
};

// Revalidate every 6 hours
export const revalidate = 21600;

export default async function TierListPage() {
  const { tiers } = await getTierListData();
  return <TierListClient tiers={tiers} />;
}
