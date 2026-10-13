'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { XP_RULES, xpAtLevel, type XPGain } from '@/lib/xp';
import BentoDashboard, { type DashboardData } from '@/components/dashboard/BentoDashboard';

// Sign-in-free preview of the dashboard with sample data (design review):
//   /world-preview/dashboard            active user
//   /world-preview/dashboard?state=new  brand-new user (onboarding tiles)
//   &theme=dark                         start in dark mode (light is the default; toggle in the top bar)
//   &alert=0                            hide the score-changed notification
//   &list=scans                       Recent scans (click a row for its full report)
//   &xp=levelup                         the XP gained this visit crosses a level (LV 07 -> 08)

const SAMPLE: DashboardData = {
  handle: 'jbawsa',
  stage: 3,
  ticker: { followers: '4,812', change7d: '+2.4%', score: 72, streak: '2 / 3', avgFit: 74 },
  scoreHistory: [
    { label: 'Jan', value: 54 },
    { label: 'Mar', value: 58 },
    { label: 'Apr', value: 63 },
    { label: 'Jul', value: 61 },
    { label: 'Sep', value: 68 },
    { label: 'Oct', value: 72 },
  ],
  streak: { done: 2, target: 3 },
  scoreDetail: [
    {
      id: 's0',
      date: '2026-01-20T17:00:00Z',
      label: 'Jan 20',
      value: 54,
      phases: [
        { key: 'Define', value: 57 },
        { key: 'Check', value: 52 },
        { key: 'Generate', value: 55 },
        { key: 'Scale', value: 52 },
      ],
      summary:
        'First scan: a builder with ideas everywhere. The voice is there, the positioning is not yet.',
    },
    {
      id: 's1',
      date: '2026-03-14T17:00:00Z',
      label: 'Mar 14',
      value: 58,
      phases: [
        { key: 'Define', value: 62 },
        { key: 'Check', value: 55 },
        { key: 'Generate', value: 60 },
        { key: 'Scale', value: 54 },
      ],
      summary:
        'A clear builder voice with a loose content mix. Positioning is there; consistency is not yet.',
    },
    {
      id: 's2',
      date: '2026-04-22T17:00:00Z',
      label: 'Apr 22',
      value: 63,
      phases: [
        { key: 'Define', value: 70 },
        { key: 'Check', value: 58 },
        { key: 'Generate', value: 66 },
        { key: 'Scale', value: 55 },
      ],
      summary:
        'Positioning sharpened around building in public. Posting is steadier, voice still drifts on promo posts.',
    },
    {
      id: 's3',
      date: '2026-07-09T17:00:00Z',
      label: 'Jul 9',
      value: 61,
      phases: [
        { key: 'Define', value: 71 },
        { key: 'Check', value: 52 },
        { key: 'Generate', value: 64 },
        { key: 'Scale', value: 56 },
      ],
      summary: 'A quieter month: fewer posts and more off-voice replies pulled Check down.',
    },
    {
      id: 's4',
      date: '2026-09-18T17:00:00Z',
      archetype: 'BUILD.EXE',
      strengths: [
        'The product reveal landed: two posts outperformed the rest.',
        'Positioning is sharpening around creator brands.',
      ],
      improvements: [
        'Growth came in one spike, then flattened.',
        'A few off-voice replies remain.',
      ],
      nextMoves: [
        'Follow the reveal with a build series while attention is high.',
        'Pin the reveal post.',
      ],
      pillars: ['Building in public', 'Creator economy'],
      label: 'Sep 18',
      value: 68,
      phases: [
        { key: 'Define', value: 75 },
        { key: 'Check', value: 62 },
        { key: 'Generate', value: 76 },
        { key: 'Scale', value: 57 },
      ],
      insights: {
        Define: ['Positioning is sharpening around BrandOS and creator brands.'],
        Check: ['More on-topic than July; a few off-voice replies remain.'],
        Generate: ['Two posts about the build outperformed the rest by a wide margin.'],
        Scale: ['Growth came in one spike after the reveal, then flattened.'],
      },
      summary:
        'The product reveal landed: Generate jumped on two posts that outperformed everything else.',
    },
    {
      id: 's5',
      date: '2026-10-06T17:00:00Z',
      archetype: 'BUILD.EXE',
      strengths: [
        'Clear builder-educator positioning: you build tools for creators, in public.',
        'The BrandOS reveal outperformed everything else by 10x: demos are your format.',
        'A consistent, taste-first voice that stands apart from trend-chasing.',
      ],
      improvements: [
        'Posting about twice a week caps momentum; reach jumps on 4+ post weeks.',
        'Promo posts drift into a more salesy tone than the rest of your feed.',
        'Text-only takes underperform: pair build updates with a visual.',
      ],
      nextMoves: [
        'Post 4x a week for the next month: two build updates, one take, one demo.',
        'Turn the reveal format into a weekly series ("what I shipped this week").',
        'Reply to your top replies with real takes to move from broadcast to conversation.',
      ],
      pillars: ['Building in public', 'Creator economy', 'Personal brand strategy'],
      label: 'Oct 6',
      value: 72,
      phases: [
        { key: 'Define', value: 78 },
        { key: 'Check', value: 64 },
        { key: 'Generate', value: 81 },
        { key: 'Scale', value: 58 },
      ],
      insights: {
        Define: [
          'Clear builder-educator positioning: building tools for creators, in public.',
          'Bio and pinned post now say the same thing: one niche, one promise.',
        ],
        Check: [
          'Voice is recognisable across posts: direct, lowercase, taste-first.',
          'Promo posts still drift into a more salesy tone than the rest.',
        ],
        Generate: [
          'The product reveal outperformed everything else by 10x: reveals and demos are your format.',
          'Short build updates with a visual land far better than text-only takes.',
        ],
        Scale: [
          'Posting about twice a week caps momentum; reach jumps on weeks with 4+ posts.',
          'Follower growth is steady but rides on single big posts rather than a cadence.',
        ],
      },
      summary:
        'Strongest read yet. Clear builder-educator positioning and content that converts; Scale is the next lever: post more often and lean into threads.',
    },
  ],
  scoreDelta: { value: 4, since: 'Sep' },
  phases: [
    { key: 'Define', value: 78 },
    { key: 'Check', value: 64 },
    { key: 'Generate', value: 81 },
    { key: 'Scale', value: 58 },
  ],
  week: {
    range: 'Oct 6 – 12',
    streakWeeks: 3,
    days: [
      { d: 'M', name: 'Mon', state: 'on', note: '1 on-brand post · fit 92' },
      { d: 'T', name: 'Tue', state: 'none' },
      { d: 'W', name: 'Wed', state: 'off', note: '1 post · fit 55' },
      { d: 'T', name: 'Thu', state: 'on', note: '1 on-brand post · fit 84' },
      { d: 'F', name: 'Fri', state: 'none', today: true },
      { d: 'S', name: 'Sat', state: 'future' },
      { d: 'S', name: 'Sun', state: 'future' },
    ],
  },
  posts: [
    {
      id: '1',
      excerpt:
        'I vibe coded a tool that scans your X content and tells you your voice, content pillars…',
      when: '2d ago',
      fit: 92,
      likes: 287,
      multiple: '28.7x',
      url: 'https://x.com/jbawsa',
      breakdown: {
        voice: 'direct, builder-first, lowercase',
        format: 'product reveal + demo clip',
        hook: 'a concrete "I built X" line in the first five words',
        why: 'Your core promise in one post: you build tools for creators, in public, and show the thing working.',
        fits: [
          'Leads with what you built, not what you think',
          'Demo format, your strongest performer',
          'Speaks straight to creators',
        ],
        misses: [],
        sharpen: [
          'Pin it, then reply with a one-line result from a real user',
          'Turn this format into a weekly "what I shipped" series',
        ],
      },
    },
    {
      id: '2',
      excerpt: 'Brick by Brick is backkkkk 🧱 This time, I’m hosting @ZTHAcademy with @EJRWEB3…',
      when: '4d ago',
      fit: 55,
      likes: 11,
      multiple: '1.0x',
      url: 'https://x.com/jbawsa',
      breakdown: {
        voice: 'hype, event-promo',
        format: 'announcement with tags',
        hook: 'an inside reference new followers won’t know',
        why: 'An event promo that reads like someone else’s brand: lots of tags, no line about what you think or build.',
        fits: ['Community-minded, which matches the builder angle'],
        misses: [
          'No point of view or lesson',
          'Tags carry the post instead of your voice',
          'Off your three content pillars',
        ],
        sharpen: [
          'Open with why you’re hosting it, in one line',
          'Add one takeaway people get even if they can’t attend',
        ],
      },
    },
    {
      id: '3',
      excerpt:
        'taste > output. the people who win this decade will be the ones who know what good looks like',
      when: '6d ago',
      fit: 84,
      likes: 64,
      multiple: '6.1x',
      url: 'https://x.com/jbawsa',
      breakdown: {
        voice: 'conviction, short-form',
        format: 'one-line take',
        hook: 'a contrarian ">" comparison up front',
        why: 'A clean statement of your taste-over-output thesis, the idea your audience follows you for.',
        fits: ['Your signature belief, stated plainly', 'Short and quotable'],
        misses: ['No example, so it reads as a slogan'],
        sharpen: [
          'Follow up with one concrete example of "good" you noticed this week',
          'Quote-post it later with proof from your own work',
        ],
      },
    },
    {
      id: '4',
      excerpt: '$100k by december. building in public, every number shared. day 12.',
      when: '1w ago',
      fit: 78,
      likes: 39,
      multiple: '3.7x',
    },
  ],
  pass: {
    handle: 'jbawsa',
    name: 'Jeffrey Basa',
    archetype: 'BUILD.EXE',
    taste: 'Scrappy builder-in-public energy',
    pillars: ['building in public', 'creator economy', 'web3'],
    stationNumber: 2,
    score: 72,
    issued: '10.2026',
  },
};

// XP earned since the last visit: daily visit, a 3-day streak, the +4 score, one on-brand post
const XP_GAINS: XPGain[] = [
  { label: 'Daily visit', xp: XP_RULES.dailyVisit },
  { label: '3-day streak', xp: 3 * XP_RULES.streakDay },
  { label: 'Score +4', xp: 4 * XP_RULES.scorePoint },
  { label: 'On-brand post', xp: XP_RULES.onBrandPost },
];
const XP_EARNED = XP_GAINS.reduce((s, g) => s + g.xp, 0); // 275

function Preview() {
  const q = useSearchParams();
  const isNew = q.get('state') === 'new';
  // &list=scans shows "Recent scans" (what a real account sees today) instead of posts
  const scansList = q.get('list') === 'scans';
  const history = SAMPLE.scoreDetail ?? [];
  const data: DashboardData = isNew
    ? { ...SAMPLE, stage: 0, ticker: { ...SAMPLE.ticker, streak: '—', avgFit: 0 } }
    : scansList
      ? {
          ...SAMPLE,
          posts: [],
          scans: history
            .map((p, i) => ({
              id: p.id,
              label: `Scan · ${p.label}`,
              score: p.value,
              delta: i > 0 ? p.value - history[i - 1].value : undefined,
            }))
            .reverse()
            .slice(0, 4),
        }
      : SAMPLE;
  return (
    <BentoDashboard
      data={data}
      isNew={isNew}
      initialTheme={q.get('theme') === 'dark' ? 'dark' : 'light'}
      // Rescan simulates a scan here (no API call): +3 after ~9s
      rescan={isNew ? undefined : 'demo'}
      // the score-changed notification (?alert=0 hides it)
      // LV 07, 1,240 / 1,750 XP after this visit (or crossing into LV 08 with &xp=levelup)
      xp={
        isNew
          ? {
              total: XP_RULES.dailyVisit,
              gains: [{ label: 'Daily visit', xp: XP_RULES.dailyVisit }],
            }
          : {
              total: xpAtLevel(7) + (q.get('xp') === 'levelup' ? 1600 + XP_EARNED : 1240),
              gains: XP_GAINS,
            }
      }
      scoreAlert={
        !isNew && q.get('alert') !== '0'
          ? { delta: SAMPLE.scoreDelta?.value ?? 0, score: SAMPLE.ticker.score }
          : null
      }
    />
  );
}

export default function DashboardPreviewPage() {
  return (
    <Suspense>
      <Preview />
    </Suspense>
  );
}
