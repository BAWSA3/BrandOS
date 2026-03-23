import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

const ARCHETYPE_COLORS: Record<string, string> = {
  ARC: '#10B981',
  ENTROPY: '#F59E0B',
  NULL: '#8B5CF6',
  FREQ: '#EC4899',
  RELAY: '#06B6D4',
  'BUILD.EXE': '#EF4444',
  SOURCE: '#3B82F6',
  FORESIGHT: '#9D4EDD',
};

const ARCHETYPE_TAGLINES: Record<string, string> = {
  ARC: 'Rising star. Growth story.',
  ENTROPY: 'Risk-taker. Cult builder.',
  NULL: 'Ideas over identity.',
  FREQ: 'Entertainer. Community builder.',
  RELAY: 'Super connector.',
  'BUILD.EXE': 'Builder. Shipper. Doer.',
  SOURCE: 'Knowledge authority.',
  FORESIGHT: 'Shapes the narrative.',
};

const ARCHETYPE_RARITY: Record<string, number> = {
  ARC: 22,
  ENTROPY: 14,
  NULL: 11,
  FREQ: 16,
  RELAY: 13,
  'BUILD.EXE': 12,
  SOURCE: 8,
  FORESIGHT: 4,
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const username = searchParams.get('u') || 'unknown';
  const archetype = searchParams.get('a') || 'ARC';
  const tier = parseInt(searchParams.get('t') || '1');
  const tierLabel = searchParams.get('tl') || 'ENTRY';
  const displayName = searchParams.get('n') || username;

  const color = ARCHETYPE_COLORS[archetype] || '#10B981';
  const tagline = ARCHETYPE_TAGLINES[archetype] || '';
  const rarity = ARCHETYPE_RARITY[archetype] || 22;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mybrandos.app';
  const iconUrl = `${appUrl}/archetypes/${encodeURIComponent(archetype)}.png`;

  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  return new ImageResponse(
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        fontFamily: 'monospace',
        position: 'relative',
      }}
    >
      {/* ===== LEFT PANEL — Dark ===== */}
      <div
        style={{
          width: '660px',
          height: '630px',
          background: '#0F1115',
          display: 'flex',
          flexDirection: 'column',
          padding: '56px 52px',
          position: 'relative',
        }}
      >
        {/* BrandOS logo */}
        <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '6px' }}>
          <div
            style={{
              fontSize: '34px',
              fontWeight: 700,
              color: '#FFFFFF',
              fontFamily: 'sans-serif',
              display: 'flex',
            }}
          >
            Brand
          </div>
          <div
            style={{
              fontSize: '34px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'sans-serif',
              display: 'flex',
            }}
          >
            OS
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '11px',
            letterSpacing: '0.15em',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '44px',
            display: 'flex',
          }}
        >
          ARCHETYPE SCAN
        </div>

        {/* Username */}
        <div
          style={{
            fontSize: '18px',
            color: 'rgba(255,255,255,0.5)',
            marginBottom: '32px',
            display: 'flex',
          }}
        >
          @{username}
        </div>

        {/* Tier badge */}
        <div
          style={{
            display: 'flex',
            fontSize: '11px',
            letterSpacing: '0.12em',
            color,
            border: `1px solid rgba(${r},${g},${b},0.35)`,
            borderRadius: '14px',
            padding: '5px 16px',
            marginBottom: '20px',
            alignSelf: 'flex-start',
            background: `rgba(${r},${g},${b},0.08)`,
          }}
        >
          TIER {tier} — {tierLabel}
        </div>

        {/* Archetype name */}
        <div
          style={{
            fontSize: '52px',
            fontWeight: 900,
            fontStyle: 'italic',
            color,
            fontFamily: 'sans-serif',
            lineHeight: 1.1,
            marginBottom: '8px',
            display: 'flex',
          }}
        >
          {archetype}
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.4)',
            display: 'flex',
            letterSpacing: '0.02em',
          }}
        >
          &ldquo;{tagline}&rdquo;
        </div>

        {/* Bottom status */}
        <div
          style={{
            position: 'absolute',
            bottom: '44px',
            left: '52px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10B981',
              display: 'flex',
            }}
          />
          <div
            style={{
              fontSize: '10px',
              color: 'rgba(255,255,255,0.35)',
              letterSpacing: '0.08em',
              display: 'flex',
            }}
          >
            mybrandos.app/archetype
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL — White with icon ===== */}
      <div
        style={{
          width: '540px',
          height: '630px',
          background: '#FAFAFA',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        {/* Subtle color warmth */}
        <div
          style={{
            position: 'absolute',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: `radial-gradient(circle, rgba(${r},${g},${b},0.06) 0%, transparent 70%)`,
            display: 'flex',
          }}
        />

        {/* 3D voxel icon — white bg blends naturally */}
        <img
          src={iconUrl}
          alt={archetype}
          width={320}
          height={320}
          style={{ marginBottom: '20px' }}
        />

        {/* Rarity badge */}
        <div
          style={{
            display: 'flex',
            fontSize: '11px',
            letterSpacing: '0.1em',
            color,
            border: `1px solid rgba(${r},${g},${b},0.25)`,
            borderRadius: '14px',
            padding: '5px 16px',
            background: `rgba(${r},${g},${b},0.06)`,
          }}
        >
          TOP {rarity}% OF CREATORS
        </div>
      </div>

      {/* Subtle divider between panels */}
      <div
        style={{
          position: 'absolute',
          left: '660px',
          top: 0,
          width: '1px',
          height: '630px',
          background: 'rgba(255,255,255,0.06)',
          display: 'flex',
        }}
      />
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );
}
