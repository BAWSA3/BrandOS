import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const username = searchParams.get('u') || 'unknown';
  const score = parseInt(searchParams.get('s') || '0');
  const archetype = searchParams.get('a') || 'Unknown';
  const rank = parseInt(searchParams.get('r') || '0');
  const total = parseInt(searchParams.get('t') || '0');
  let pfp = searchParams.get('pfp') || '';
  // Normalize PFP to _200x200 — more reliably available than _400x400
  if (pfp) {
    pfp = pfp.replace(/_(?:normal|bigger|mini|400x400)\./i, '_200x200.');
  }

  const tierName =
    score >= 80 ? 'ELITE' : score >= 60 ? 'STRONG' : 'RISING';
  const tierColor =
    score >= 80 ? '#0047FF' : score >= 60 ? '#10B981' : '#F59E0B';
  const percentile = total > 0 ? Math.round((1 - (rank - 1) / total) * 100) : 0;

  function renderBar(value: number, max: number = 100) {
    const filled = Math.round((value / max) * 24);
    return '\u2588'.repeat(filled) + '\u2591'.repeat(24 - filled);
  }

  return new ImageResponse(
    <div
      style={{
        width: '1200px',
        height: '630px',
        background: '#0a0a0a',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 56px',
        fontFamily: 'monospace',
        position: 'relative',
      }}
    >
      {/* Scanline overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px)',
          display: 'flex',
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ color: '#0047FF', fontSize: '14px', letterSpacing: '0.15em' }}>
            BRANDOS v2.0
          </div>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>//</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', letterSpacing: '0.1em' }}>
            TIER LIST RANKING
          </div>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', letterSpacing: '0.1em' }}>
          mybrandos.app/tier-list
        </div>
      </div>

      {/* Separator */}
      <div
        style={{
          color: 'rgba(255,255,255,0.15)',
          fontSize: '12px',
          marginBottom: '32px',
          display: 'flex',
        }}
      >
        {'/* ════════════════════════════════════════════════════════════════════ */'}
      </div>

      {/* Main content */}
      <div style={{ display: 'flex', gap: '48px', flex: 1 }}>
        {/* Left: Profile + Identity */}
        <div style={{ display: 'flex', flexDirection: 'column', width: '420px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '28px' }}>
            {/* Profile pic */}
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50px',
                border: `3px solid ${tierColor}`,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#1a1a1a',
              }}
            >
              {pfp ? (
                <img
                  src={pfp}
                  width={100}
                  height={100}
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div style={{ color: '#555', fontSize: '36px', display: 'flex' }}>?</div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '13px',
                  letterSpacing: '0.1em',
                  display: 'flex',
                }}
              >
                @{username}
              </div>
              {archetype && archetype !== 'Unknown' && (
                <div
                  style={{
                    color: tierColor,
                    fontSize: '18px',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase' as const,
                    display: 'flex',
                  }}
                >
                  THE {archetype}
                </div>
              )}
            </div>
          </div>

          {/* Score */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', marginBottom: '16px' }}>
            <div style={{ color: '#fff', fontSize: '72px', fontWeight: 700, display: 'flex', lineHeight: 1 }}>
              {score}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '24px', display: 'flex' }}>
              / 100
            </div>
          </div>

          {/* Score bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ color: tierColor, fontSize: '14px', display: 'flex', letterSpacing: '0.05em' }}>
              {renderBar(score)}
            </div>
          </div>

          {/* Tier badge */}
          <div
            style={{
              display: 'flex',
              padding: '10px 20px',
              background: `${tierColor}15`,
              border: `1px solid ${tierColor}40`,
              borderRadius: '4px',
              width: 'fit-content',
            }}
          >
            <span style={{ color: tierColor, fontSize: '14px', letterSpacing: '0.15em', fontWeight: 600 }}>
              {tierName} TIER
            </span>
          </div>
        </div>

        {/* Right: Rank + Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '8px',
              padding: '32px 40px',
              border: `1px solid ${tierColor}30`,
              borderRadius: '8px',
              background: `${tierColor}08`,
            }}
          >
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', letterSpacing: '0.15em', display: 'flex' }}>
              RANKED
            </div>
            <div style={{ color: '#fff', fontSize: '64px', fontWeight: 700, display: 'flex', lineHeight: 1 }}>
              #{rank}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', letterSpacing: '0.1em', display: 'flex' }}>
              of {total.toLocaleString()} creators
            </div>
            <div
              style={{
                marginTop: '12px',
                padding: '6px 16px',
                background: tierColor,
                borderRadius: '4px',
                display: 'flex',
              }}
            >
              <span style={{ color: '#fff', fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em' }}>
                TOP {percentile}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            color: 'rgba(255,255,255,0.2)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            display: 'flex',
          }}
        >
          {'// where do you rank?'}
        </div>
        <div
          style={{
            display: 'flex',
            padding: '8px 16px',
            background: '#0047FF',
            borderRadius: '4px',
          }}
        >
          <span style={{ color: '#fff', fontSize: '12px', letterSpacing: '0.12em' }}>
            SEE THE FULL TIER LIST → mybrandos.app/tier-list
          </span>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );
}
