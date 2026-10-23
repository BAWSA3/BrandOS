import type { Metadata } from 'next';
import GrowthDashboard from '@/components/growth/GrowthDashboard';
import { SAMPLE_IDEAS, SAMPLE_VIEW } from './sample';

// Layout preview for the growth dashboard (decided 2026-10-22), sample data.
// /world-preview/* is hidden on mybrandos.app (middleware).

export const metadata: Metadata = { title: 'Dashboard preview · BrandOS' };

export default function GrowthPreviewPage() {
  return <GrowthDashboard view={SAMPLE_VIEW} ideas={SAMPLE_IDEAS} sample />;
}
