'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import BentoDashboard, { type DashboardData } from '@/components/dashboard/BentoDashboard';

// Sign-in-free preview of the dashboard with sample data (design review):
//   /world-preview/dashboard            active user
//   /world-preview/dashboard?state=new  brand-new user (onboarding tiles)
//   &theme=dark                         start in dark mode (light is the default; toggle in the top bar)
//   &alert=0                            hide the score-changed notification

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
      // the score-changed notification (?alert=0 hides it)
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
