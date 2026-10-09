'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import BentoDashboard, { type DashboardData } from '@/components/dashboard/BentoDashboard';
import {
  BIG_FONTS,
  MONO_FONTS,
  PASS_FONTS,
  pick,
  type FontOption,
} from '@/components/dashboard/dashFonts';

// Sign-in-free preview of the dashboard with sample data (design review):
//   /world-preview/dashboard            active user
//   /world-preview/dashboard?state=new  brand-new user (onboarding tiles)
//   &mono=share&big=geist&pass=courier  try fonts (see /world-preview/fonts); a switcher sits bottom-right

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

function FontSwitcher() {
  const q = useSearchParams();
  const router = useRouter();
  const set = (role: string, key: string) => {
    const next = new URLSearchParams(q.toString());
    next.set(role, key);
    router.replace(`?${next.toString()}`, { scroll: false });
  };
  const row = (role: string, label: string, list: FontOption[]) => (
    <label className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <select
        value={pick(list, q.get(role)).key}
        onChange={(e) => set(role, e.target.value)}
        className="bg-transparent text-right outline-none"
        style={{ color: '#E7E7E4' }}
      >
        {list.map((f) => (
          <option key={f.key} value={f.key} style={{ background: '#161618' }}>
            {f.label}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <div
      className="fixed bottom-4 right-4 z-50 w-[300px] space-y-2 border p-3 text-[12px]"
      style={{
        background: '#161618',
        borderColor: '#0047FF',
        color: '#8A8A86',
        fontFamily: 'ui-monospace, monospace',
      }}
    >
      <div className="text-[10px] uppercase tracking-[0.14em] text-[#0047FF]">Font review</div>
      {row('mono', 'Labels', MONO_FONTS)}
      {row('big', 'Numbers', BIG_FONTS)}
      {row('pass', 'Pass', PASS_FONTS)}
    </div>
  );
}

function Preview() {
  const q = useSearchParams();
  const isNew = q.get('state') === 'new';
  const data: DashboardData = isNew
    ? { ...SAMPLE, stage: 0, ticker: { ...SAMPLE.ticker, streak: '—', avgFit: 0 } }
    : SAMPLE;
  const fonts = {
    mono: pick(MONO_FONTS, q.get('mono')).family,
    big: pick(BIG_FONTS, q.get('big')).family,
    pass: pick(PASS_FONTS, q.get('pass')).family,
  };
  return (
    <>
      <BentoDashboard data={data} isNew={isNew} fonts={fonts} />
      <FontSwitcher />
    </>
  );
}

export default function DashboardPreviewPage() {
  return (
    <Suspense>
      <Preview />
    </Suspense>
  );
}
