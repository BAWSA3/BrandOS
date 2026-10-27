import type { Metadata } from 'next';
import Shell from '@/components/dashboard-v2/Shell';
import Today from '@/components/dashboard-v2/Today';
import GrowthDashboard from '@/components/growth/GrowthDashboard';
import Playbook, { type PlaybookData } from '@/components/dashboard-v2/Playbook';
import { bodyOfWork } from '@/lib/playbook';
import { classLabel, recordDate } from '@/lib/classifications';
import { isColorway } from '@/lib/colorways';
import { SAMPLE_IDEAS, SAMPLE_RECORD, SAMPLE_VIEW } from '../growth/sample';

// Dashboard v2, slice 1 (Today + the calmed growth view in each finish) with
// sample data, so it can be checked without a tester account. The real page is
// /dashboard behind DASHBOARD_V2. Hidden on mybrandos.app (middleware).
//   ?c=bone|night|klein|paper  &view=brand

export const metadata: Metadata = { title: 'Dashboard v2 preview · BrandOS' };

/** Sample Playbook built the way /dashboard builds it (loadPlaybook), from the growth sample. */
function samplePlaybook(): PlaybookData {
  const now = new Date(Date.UTC(2026, 9, 27));
  const at = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86_400_000);
  // eight weeks of ideas and posts that grow, so the chart has a story
  const ideas = Array.from({ length: 44 }, (_, i) => ({
    createdAt: at(55 - Math.floor(Math.sqrt(i) * 8.2)),
    status: i % 3 === 0 ? 'posted' : i % 3 === 1 ? 'drafting' : 'saved',
  }));
  const posts = Array.from({ length: 30 }, (_, i) => ({
    postedAt: at(55 - Math.floor(Math.sqrt(i) * 10)),
  }));
  const v = SAMPLE_VIEW;
  return {
    handle: v.brand.handle,
    entryNo: 42,
    classification: classLabel(v.score?.archetype, '/'),
    readOn: v.score ? recordDate(v.score.scannedAt) : null,
    proof: '+412 followers, reach up 38%, 9 posts scored 80+',
    positioning:
      'A builder-creator who turns creator-economy data into plain advice: what brands look for, and how to get found by them.',
    pillars: ['Brand deals, explained', 'Building BrandOS in public', 'Creator economy data'],
    strengths: [
      'Specific numbers in the first line',
      'Replies that turn into conversations',
      'Consistent topic: creators and brands',
    ],
    gap: 'Your best ideas arrive as one-off posts. Turn the strongest into a series so the next one has an audience waiting.',
    voice: ['Lowercase, direct, a number up top.', 'Off-voice drift: the “gm” posts.'],
    working: v.formats
      .filter((f) => f.rate !== null)
      .map((f) => ({
        label: f.label,
        rate: f.rate ?? 0,
        share: f.share,
        top: f.format === 'thread',
      })),
    best: {
      text: v.best[0].text,
      why: v.best[0].why,
      href: `https://x.com/${v.brand.handle}/status/${v.best[0].tweetId}`,
    },
    record: {
      score: 72,
      delta: 2,
      since: '14 Oct',
      phases: [
        { k: 'Define', v: 78 },
        { k: 'Check', v: 71 },
        { k: 'Generate', v: 68 },
        { k: 'Scale', v: 69 },
      ],
      moved: [
        {
          phase: 'Generate',
          delta: 4,
          why: '“i asked 40 brands why they skipped creators…”: 41× your usual likes',
        },
        { phase: 'Check', delta: -1, why: '“gm. building today”: off-brand, fit 41' },
      ],
    },
    weeks: bodyOfWork(
      { ideas, posts, reads: SAMPLE_RECORD.history.map((h) => ({ at: h.at, score: h.score })) },
      now
    ),
    links: {
      brand: '/world-preview/today?view=brand',
      board: '/world-preview/today?view=brand#ideas',
      write: '/world-preview/write',
      doMore: '/world-preview/write',
    },
  };
}

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
      <Shell
        finish={finish}
        place="brand"
        brandId={null}
        brands={view.brands}
        standing={standing}
        preview
      >
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
  if (sp.view === 'playbook') {
    return (
      <Shell
        finish={finish}
        place="playbook"
        brandId={null}
        brands={view.brands}
        standing={standing}
        preview
      >
        <Playbook data={samplePlaybook()} />
      </Shell>
    );
  }
  const ideas = SAMPLE_IDEAS.map((i) => ({
    id: String(i.id),
    text: i.text,
    status: i.col === 'ideas' ? 'saved' : i.col,
  }));
  return (
    <Shell
      finish={finish}
      place="today"
      brandId={null}
      brands={view.brands}
      standing={standing}
      preview
    >
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
