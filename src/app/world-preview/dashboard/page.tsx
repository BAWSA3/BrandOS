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
//   &xp=levelup                         the XP gained this visit crosses a level (LV 07 -> 08)

const SAMPLE: DashboardData = {
  handle: 'jbawsa',
  stage: 3,
  ticker: { followers: '4,812', change7d: '+2.4%', score: 72, streak: '2 / 3', avgFit: 74 },
  scoreHistory: [
    { label: 'Mar', value: 58 },
    { label: 'Apr', value: 63 },
    { label: 'Jul', value: 61 },
    { label: 'Sep', value: 68 },
    { label: 'Oct', value: 72 },
  ],
  streak: { done: 2, target: 3 },
  scoreDetail: [
    {
      id: 's1',
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
    },
    {
      id: '2',
      excerpt: 'Brick by Brick is backkkkk 🧱 This time, I’m hosting @ZTHAcademy with @EJRWEB3…',
      when: '4d ago',
      fit: 55,
      likes: 11,
      multiple: '1.0x',
    },
    {
      id: '3',
      excerpt:
        'taste > output. the people who win this decade will be the ones who know what good looks like',
      when: '6d ago',
      fit: 84,
      likes: 64,
      multiple: '6.1x',
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
  const data: DashboardData = isNew
    ? { ...SAMPLE, stage: 0, ticker: { ...SAMPLE.ticker, streak: '—', avgFit: 0 } }
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
