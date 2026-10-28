import type { Metadata } from 'next';
import type { PlanBadge } from '@/components/billing/PlanChip';
import Shell from '@/components/dashboard-v2/Shell';
import { roomFormat } from '@/lib/article';
import Today from '@/components/dashboard-v2/Today';
import GrowthDashboard from '@/components/growth/GrowthDashboard';
import WritingRoom from '@/components/dashboard-v2/WritingRoom';
import type { DraftScoreResult } from '@/components/growth/DraftScore';
import Playbook, { type PlaybookData } from '@/components/dashboard-v2/Playbook';
import { bodyOfWork } from '@/lib/playbook';
import { classLabel, recordDate } from '@/lib/classifications';
import { isColorway } from '@/lib/colorways';
import { SAMPLE_IDEAS, SAMPLE_RECORD, SAMPLE_VIEW } from '../growth/sample';

// Dashboard v2, slice 1 (Today + the calmed growth view in each finish) with
// sample data, so it can be checked without a tester account. The real page is
// /dashboard behind DASHBOARD_V2. Hidden on mybrandos.app (middleware).
//   ?c=bone|night|klein|paper  &view=brand

// the launch-window buy button, as a member without a card sees it
const PREVIEW_PLAN: PlanBadge = {
  kind: 'open',
  until: '2026-12-03T00:00:00.000Z',
  spotsLeft: 100,
};

export const metadata: Metadata = { title: 'Dashboard v2 preview · BrandOS' };

const DEMO_SCORE: DraftScoreResult = {
  score: 81,
  verdict: 'On-brand and specific. The strongest line is buried: lead with it.',
  format: 'Text',
  formatLift: 1.3,
  reach: { low: 0.9, high: 1.6 },
  fixes: [
    {
      text: 'Open with the number: “31 of 40 brands scroll a profile for 10 seconds.”',
      source: 'model',
    },
    { text: 'Posts with an image earn 2.1× your text-only ones. Add the chart.', source: 'data' },
  ],
  voice: 'Sounds like you',
  hook: 'Buried in line three',
  why: '',
  basedOn: 41,
};

const DEMO_OUTLINE = `Title: What 40 brands told me about the creators they skip
Hook: I asked 40 brands why they passed on creators they liked. The answer was rarely followers.
1. The 10-second profile scroll | brands decide before they read a single post
2. “We couldn’t tell what they stand for” | the most common reason, in their words
3. Three pillars beat thirty topics | what the creators who got picked did differently
4. A 30-day test you can run | post on three things only, then watch who shows up`;

const DEMO_SECTION = `31 of the 40 brands said the same thing in different words: they give a profile about ten seconds.

In those ten seconds they scroll your last nine posts. If those posts are about nine different things, they can’t picture what you’d make for them, so they move on. Nobody told me that before I asked.

[the brand you quote here] put it best: “we’re not buying a post, we’re buying a person who already talks about our thing.”`;

const DEMO_OPTIONS = `31 of 40 brands told me they scroll a creator’s profile for 10 seconds.

if the last 9 posts are about 9 different things, they move on.

pick 3 things. post only those for 30 days. watch who shows up.
---
part two of the 40-brands thing.

the top reason they skipped creators wasn’t followers. it was “we couldn’t tell what they stand for.”`;

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
  searchParams: Promise<{ c?: string; view?: string; mode?: string }>;
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
        plan={PREVIEW_PLAN}
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
  if (sp.view === 'write') {
    return (
      <Shell
        finish={finish}
        place="playbook"
        brandId={null}
        brands={view.brands}
        standing={standing}
        plan={PREVIEW_PLAN}
        preview
        focus
      >
        <WritingRoom
          idea="A follow-up to my post “i asked 40 brands why they skipped creators”"
          accountId="sample"
          handle={view.brand.handle}
          initialFormat={roomFormat(sp.mode)}
          boardIdeas={[
            { id: 'i1', text: 'How I priced my first brand deal' },
            { id: 'i2', text: 'Why I stopped posting “gm”' },
          ]}
          topPosts={[
            {
              text: 'i asked 40 brands why they skipped creators. here is what they said',
              note: 'A top post / 1,840 likes',
            },
          ]}
          demo={{
            score: DEMO_SCORE,
            options: DEMO_OPTIONS,
            outline: DEMO_OUTLINE,
            section: DEMO_SECTION,
          }}
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
        plan={PREVIEW_PLAN}
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
      plan={PREVIEW_PLAN}
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
