'use client';

import { useRouter } from 'next/navigation';
import WrappedReveal, { WrappedRevealData } from '@/components/WrappedReveal';

// Sample mock data for testing the WrappedReveal component
const mockData: WrappedRevealData = {
  // Profile
  username: 'buildwithai',
  displayName: 'BuildWithAI',
  profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=buildwithai&size=200',
  followersCount: 48500,
  
  // Score
  brandScore: 82,
  voiceConsistency: 78,
  
  // Personality
  archetype: 'The Creator',
  archetypeEmoji: '🎨',
  personalityType: 'ENTP',
  personalitySummary: 'You bring ideas to life with precision and purpose. Your community trusts you to deliver substance over hype. Known for blending technical depth with accessible explanations.',
  
  // Tone
  tone: {
    formality: 35,      // More casual
    energy: 75,         // High energy
    confidence: 85,     // Very confident
    style: 60,          // Balanced humor
  },
  
  // Influence
  influenceTier: 'Mid',
  
  // Brand Colors (extracted from content)
  brandColors: {
    primary: '#0047FF',
    secondary: '#9d4edd',
    accent: '#10B981',
  },
  
  // Content Pillars
  contentPillars: [
    { name: 'AI/ML', frequency: 42, avgEngagement: 3200 },
    { name: 'Product Design', frequency: 28, avgEngagement: 2800 },
    { name: 'Startup Lessons', frequency: 18, avgEngagement: 4100 },
    { name: 'Tech Commentary', frequency: 12, avgEngagement: 2400 },
  ],
};

// Alternative mock data for different test scenarios
const altMockData: WrappedRevealData = {
  username: 'elonmusk',
  displayName: 'Elon Musk',
  profileImageUrl: 'https://api.dicebear.com/7.x/avataaars/png?seed=elonmusk&size=200',
  followersCount: 185000000,
  brandScore: 94,
  voiceConsistency: 65,
  archetype: 'The Visionary',
  archetypeEmoji: '🚀',
  personalityType: 'INTJ',
  personalitySummary: 'A bold futurist who commands attention with audacious visions. Your unconventional style polarizes but captivates millions.',
  tone: {
    formality: 15,
    energy: 90,
    confidence: 95,
    style: 85,
  },
  influenceTier: 'Mega',
  brandColors: {
    primary: '#1DA1F2',
    secondary: '#FF6B35',
    accent: '#FFD700',
  },
  contentPillars: [
    { name: 'Technology', frequency: 35, avgEngagement: 450000 },
    { name: 'SpaceX', frequency: 25, avgEngagement: 380000 },
    { name: 'Tesla', frequency: 20, avgEngagement: 420000 },
    { name: 'Memes', frequency: 20, avgEngagement: 520000 },
  ],
};

// Low score test data
const lowScoreMockData: WrappedRevealData = {
  username: 'newcreator',
  displayName: 'New Creator',
  profileImageUrl: undefined,
  followersCount: 234,
  brandScore: 38,
  voiceConsistency: 42,
  archetype: 'The Explorer',
  archetypeEmoji: '🔍',
  personalityType: 'ISFP',
  personalitySummary: 'You\'re on the journey of discovering your unique voice. Your authenticity shines through as you experiment with different content styles.',
  tone: {
    formality: 50,
    energy: 45,
    confidence: 35,
    style: 40,
  },
  influenceTier: 'Nano',
  brandColors: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    accent: '#EC4899',
  },
  contentPillars: [
    { name: 'Personal Stories', frequency: 40, avgEngagement: 45 },
    { name: 'Random Thoughts', frequency: 35, avgEngagement: 32 },
    { name: 'Reposts', frequency: 25, avgEngagement: 18 },
  ],
};

const dataPresets = {
  default: mockData,
  mega: altMockData,
  low: lowScoreMockData,
};

export default function TestWrappedPage() {
  const router = useRouter();
  
  // Get preset from URL query or default
  const searchParams = typeof window !== 'undefined' 
    ? new URLSearchParams(window.location.search) 
    : null;
  const preset = (searchParams?.get('preset') || 'default') as keyof typeof dataPresets;
  const data = dataPresets[preset] || mockData;

  const handleAnalyzeAnother = () => {
    router.push('/score');
  };

  const handleClaim = () => {
    alert('Claim button clicked! This would trigger signup flow.');
  };

  return (
    <>
      {/* Preset Selector (fixed in top-left) */}
      <div
        style={{
          position: 'fixed',
          top: '16px',
          left: '16px',
          zIndex: 1000,
          display: 'flex',
          gap: '8px',
          padding: '8px',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <span style={{ 
          fontSize: '11px', 
          color: 'rgba(255,255,255,0.5)', 
          fontFamily: 'monospace',
          alignSelf: 'center',
          marginRight: '4px',
        }}>
          Test preset:
        </span>
        {Object.keys(dataPresets).map((key) => (
          <button
            key={key}
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('preset', key);
              window.location.href = url.toString();
            }}
            style={{
              padding: '6px 12px',
              fontSize: '11px',
              fontFamily: 'monospace',
              background: preset === key ? '#0047FF' : 'rgba(255,255,255,0.1)',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {key}
          </button>
        ))}
      </div>

      {/* The Wrapped Reveal Component */}
      <WrappedReveal
        data={data}
        onAnalyzeAnother={handleAnalyzeAnother}
        onClaim={handleClaim}
      />
    </>
  );
}
