'use client';

import { useBrandStore } from '@/lib/store';
import XBrandScoreHero from '@/components/XBrandScoreHero';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useInnerCircle } from '@/components/InnerCircleBadge';
import { useAuth } from '@/hooks/useAuth';
import { fieldSwitch } from '@/lib/field/switch';
import { getAppEnv } from '@/lib/app-env';
import type { LandingData } from '@/lib/landing-data';

// =============================================================================
// Landing Page. With the Direction 03 switch on (src/lib/field/switch.ts) the
// hero sits on the field; off, it's today's page.
// =============================================================================

export default function LandingClient({
  fieldEnv,
  landing,
}: {
  /** FIELD_SYSTEM === "true" on the server. */
  fieldEnv: boolean;
  /** Live numbers for the landing scroll (only shown on the field). */
  landing?: LandingData;
}) {
  const { theme } = useBrandStore();

  // Handle invite code validation on landing page
  useInnerCircle();

  // Handle OAuth callback tokens (if redirected here with tokens in URL hash)
  useAuth();

  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#F2EFE8' }} />}>
      <Landing theme={theme} fieldEnv={fieldEnv} landing={landing} />
    </Suspense>
  );
}

function Landing({
  theme,
  fieldEnv,
  landing,
}: {
  theme: string;
  fieldEnv: boolean;
  landing?: LandingData;
}) {
  const sp = useSearchParams();
  // No admin check here: the homepage stays static, so on production only the
  // env flag turns it on (?field=1 works on staging and previews).
  const field = fieldSwitch({
    envFlag: fieldEnv ? 'true' : undefined,
    appEnv: getAppEnv(),
    param: sp.get('field'),
  });
  return (
    <div
      className="aura-background"
      style={{
        minHeight: '100vh',
        background: '#F2EFE8',
        position: 'relative',
        // On the field: clip (not hidden/auto), so the page isn't a scroll container
        // and the landing scroll's pinned chapter can stick.
        overflowX: field ? 'clip' : 'hidden',
        overflowY: field ? 'visible' : 'auto',
      }}
    >
      {/* Film Grain Texture (not on the field: the loop video has none) */}
      <div
        hidden={field}
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
      <LandingScan theme={theme} field={field} landing={landing} />
    </div>
  );
}

const HANDLE_RE = /^@?[A-Za-z0-9_]{1,15}$/;

// `/?scan=<handle>` opens the site and runs that handle's scan straight away.
// It's the landing link from the BrandOS MCP (Claude / ChatGPT breakdowns), so
// people arrive at their full brand read without retyping their handle.
function LandingScan({
  theme,
  field,
  landing,
}: {
  theme: string;
  field: boolean;
  landing?: LandingData;
}) {
  const raw = useSearchParams().get('scan')?.trim() ?? '';
  const handle = HANDLE_RE.test(raw) ? raw.replace(/^@/, '') : undefined;
  return (
    <XBrandScoreHero
      theme={theme}
      initialUsername={handle}
      autoStart={!!handle}
      field={field}
      landing={field ? landing : undefined}
    />
  );
}
