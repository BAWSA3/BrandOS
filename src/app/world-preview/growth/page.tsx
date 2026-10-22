import type { Metadata } from 'next';
import GrowthDashboard from './GrowthDashboard';

// Layout preview for the growth-first dashboard (decided 2026-10-22).
// /world-preview/* is hidden on mybrandos.app (middleware).

export const metadata: Metadata = { title: 'Dashboard preview · BrandOS' };

export default function GrowthPreviewPage() {
  return <GrowthDashboard />;
}
