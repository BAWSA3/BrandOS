'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import XBrandScoreHero from '@/components/XBrandScoreHero';
import { analytics } from '@/lib/analytics';

function UTMTracker() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const source = searchParams.get('utm_source') || 'x_article';
    const medium = searchParams.get('utm_medium') || 'article';
    const campaign = searchParams.get('utm_campaign') || 'brand_ai';

    try {
      localStorage.setItem(
        'brandos_referral',
        JSON.stringify({ source, medium, campaign, timestamp: Date.now() })
      );
    } catch {
      // localStorage unavailable (private browsing, etc.)
    }

    analytics.featureUsed('article_landing');
  }, [searchParams]);

  return null;
}

export default function ArticlePage() {
  return (
    <div
      style={{
        position: 'relative',
        minHeight: '100vh',
        background: '#000000',
        overflow: 'hidden',
      }}
    >
      {/* Subtle blue orb */}
      <div
        style={{
          position: 'fixed',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(600px, 90vw)',
          height: 'min(600px, 90vw)',
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(0,71,255,0.15) 0%, rgba(0,71,255,0.05) 40%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Film Grain Texture */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          opacity: 0.05,
          pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundSize: '150px 150px',
          zIndex: 10,
        }}
      />

      {/* Article context header */}
      <div
        style={{
          position: 'relative',
          zIndex: 5,
          textAlign: 'center',
          paddingTop: 'clamp(48px, 10vh, 96px)',
          paddingLeft: '24px',
          paddingRight: '24px',
        }}
      >
        {/* Badge */}
        <div
          style={{
            fontFamily: "'VCR OSD Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.15em',
            color: '#F5A623',
            marginBottom: '16px',
            textTransform: 'uppercase',
          }}
        >
          FROM THE ARTICLE
        </div>

        {/* Headline */}
        <h1
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
            fontWeight: 300,
            lineHeight: 1.3,
            color: '#FFFFFF',
            margin: '0 auto',
            maxWidth: '560px',
          }}
        >
          You read about building
          <br />a brand with AI.
          <br />
          <span style={{ color: '#0047FF', fontWeight: 500 }}>
            Now see yours.
          </span>
        </h1>
      </div>

      {/* XBrandScoreHero */}
      <div style={{ position: 'relative', zIndex: 5 }}>
        <Suspense fallback={null}>
          <XBrandScoreHero theme="dark" />
        </Suspense>
      </div>

      {/* UTM Tracking */}
      <Suspense fallback={null}>
        <UTMTracker />
      </Suspense>
    </div>
  );
}
