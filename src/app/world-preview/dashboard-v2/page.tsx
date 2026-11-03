import type { Metadata } from 'next';
import DashboardV2 from './DashboardV2';
import { parseInitial } from './initial';

// Dashboard v2 mockups (Phase 1 of docs/strategy/DASHBOARD-V2-AUDIT.md), for
// Bawsa's approval. Sample data only: no sign-in, no API calls, no writes.
// /world-preview/* is hidden on mybrandos.app (middleware).
//   ?s=today|playbook|canvas|write|framework|standing|press
//   &c=bone|night|klein|paper  &first=1  &k=1  &chrome=0

export const metadata: Metadata = { title: 'Dashboard v2 mockups · BrandOS' };

export default async function DashboardV2Preview({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const initial = parseInitial(await searchParams);
  return <DashboardV2 key={`${initial.s}-${initial.c}-${initial.first}`} initial={initial} />;
}
