import type { Metadata } from 'next';
import GrowthDashboard from '@/components/growth/GrowthDashboard';
import { SAMPLE_IDEAS, SAMPLE_RECORD, SAMPLE_VIEW } from './sample';

// Layout preview for the growth dashboard (decided 2026-10-22), sample data.
// /world-preview/* is hidden on mybrandos.app (middleware).

export const metadata: Metadata = { title: 'Dashboard preview · BrandOS' };

export default async function GrowthPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ field?: string }>;
}) {
  const { field } = await searchParams;
  return (
    <GrowthDashboard
      view={SAMPLE_VIEW}
      ideas={SAMPLE_IDEAS}
      record={SAMPLE_RECORD}
      sample
      field={field === '1'}
      plan={{ kind: 'open', until: '2026-12-03T00:00:00.000Z', spotsLeft: 100 }}
    />
  );
}
