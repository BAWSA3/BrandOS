'use client';

import XBrandScoreHero from '@/components/XBrandScoreHero';

// Design preview: the free scan's reveal on the field (Direction 03), sample
// data, no scan and no SocialData call. /world-preview/* is hidden on
// mybrandos.app (middleware).
const insight = (s: string) => [s];

export default function FieldRevealPreview() {
  return (
    <div style={{ minHeight: '100vh', background: '#F2EFE8' }}>
      <XBrandScoreHero
        theme="light"
        field
        previewReveal={{
          profile: {
            name: 'Bawsa',
            username: 'jbawsa',
            description: '',
            profile_image_url: '',
            followers_count: 31318,
            following_count: 1200,
            tweet_count: 9800,
            verified: false,
          },
          brandScore: {
            overallScore: 72,
            phases: {
              define: { score: 78, insights: insight('Clear builder identity.') },
              check: { score: 71, insights: insight('Consistent voice.') },
              generate: { score: 68, insights: insight('Fewer original threads lately.') },
              scale: { score: 69, insights: insight('Strong replies, weaker reposts.') },
            },
            topStrengths: ['Clear identity'],
            topImprovements: ['More original threads'],
            summary: 'A builder brand with a clear voice.',
            archetype: { primary: 'BUILD.EXE' },
          },
        }}
      />
    </div>
  );
}
