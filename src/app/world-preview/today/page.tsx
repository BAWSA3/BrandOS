import type { Metadata } from 'next';
import Shell from '@/components/dashboard-v2/Shell';
import Today from '@/components/dashboard-v2/Today';
import GrowthDashboard from '@/components/growth/GrowthDashboard';
import { isColorway } from '@/lib/colorways';
import { SAMPLE_IDEAS, SAMPLE_RECORD, SAMPLE_VIEW } from '../growth/sample';

// Dashboard v2, slice 1 (Today + the calmed growth view in each finish) with
// sample data, so it can be checked without a tester account. The real page is
// /dashboard behind DASHBOARD_V2. Hidden on mybrandos.app (middleware).
//   ?c=bone|night|klein|paper  &view=brand

export const metadata: Metadata = { title: 'Dashboard v2 preview · BrandOS' };

export default async function TodayPreview({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; view?: string }>;
}) {
  const sp = await searchParams;
  const finish = isColorway(sp.c) ? sp.c : 'bone';
  const standing = { level: 7, progress: 0.91, run: 9 };
  const view = SAMPLE_VIEW;
  if (sp.view === 'brand') {
    return (
      <Shell finish={finish} place="brand" brandId={null} standing={standing}>
        <GrowthDashboard
          view={view}
          ideas={SAMPLE_IDEAS}
          record={SAMPLE_RECORD}
          sample
          colorway={finish}
          v2
        />
      </Shell>
    );
  }
  const ideas = SAMPLE_IDEAS.map((i) => ({
    id: String(i.id),
    text: i.text,
    status: i.col === 'ideas' ? 'saved' : i.col,
  }));
  return (
    <Shell finish={finish} place="today" brandId={null} standing={standing}>
      <Today
        name="Bawsa"
        dayLabel="Tuesday 27 Oct 2026"
        day="2026-10-27"
        brandQuery=""
        openIdeas={ideas.filter((i) => i.status !== 'posted').length}
        input={{
          handle: view.brand.handle,
          outlier: view.outlier,
          formats: view.formats,
          score: view.score && {
            value: view.score.value,
            weakest: view.score.weakest,
            phases: view.score.phases,
            nextMoves: view.score.nextMoves,
          },
          ideas,
        }}
        scoreLine={{ value: 72, delta: 2, since: '14 Oct' }}
      />
    </Shell>
  );
}
