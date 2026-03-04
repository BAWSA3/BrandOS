'use client';

import { useBrandStore } from '@/lib/store';
import XBrandScoreHero from '@/components/XBrandScoreHero';
import { Suspense } from 'react';
import { useInnerCircle } from '@/components/InnerCircleBadge';
import { useAuth } from '@/hooks/useAuth';


// =============================================================================
// Landing Page — Klein blue ASCII DNA background
// =============================================================================

export default function LandingPage() {
  const { theme } = useBrandStore();

  // Handle invite code validation on landing page
  useInnerCircle();

  // Handle OAuth callback tokens (if redirected here with tokens in URL hash)
  useAuth();

  return (
    <div
      className="aura-background"
      style={{
        minHeight: '100vh',
        background: '#2F54EB',
        position: 'relative',
        overflowX: 'hidden',
        overflowY: 'auto',
      }}
    >
      {/* Film Grain Texture */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          opacity: 0.04,
          pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '150px 150px',
          zIndex: 10,
        }}
      />

      {/* Main Content - X Brand Score Lead Magnet */}
      <Suspense fallback={null}>
        <XBrandScoreHero theme={theme} />
      </Suspense>
    </div>
  );
}
