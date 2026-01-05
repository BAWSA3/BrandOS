'use client';

import BrandOSDashboard, { BrandOSDashboardData } from '@/components/BrandOSDashboard';

const mockData: BrandOSDashboardData = {
  profile: {
    username: 'naval',
    displayName: 'Naval',
    profileImageUrl: 'https://pbs.twimg.com/profile_images/1256841238298292232/ycqwaMI2_400x400.jpg',
    followersCount: '2.1M',
    verified: true,
  },
  scores: {
    brandScore: 87,
    voiceConsistency: 92,
    engagementScore: 78,
  },
  personality: {
    archetype: 'The Philosopher',
    emoji: '🧠',
    type: 'INTJ',
  },
  tone: {
    formality: 65,
    energy: 45,
    confidence: 88,
  },
  pillars: [
    { label: 'Wisdom', value: 85 },
    { label: 'Wealth', value: 72 },
    { label: 'Health', value: 58 },
  ],
  dna: {
    keywords: ['leverage', 'compounding', 'specific-knowledge', 'accountability', 'judgment'],
    voice: 'Distilling complex ideas into timeless, actionable wisdom.',
  },
};

export default function TestDashboardPage() {
  return <BrandOSDashboard data={mockData} />;
}
