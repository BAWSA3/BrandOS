import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const username = searchParams.get('u') || 'unknown';
  const score = parseInt(searchParams.get('s') || '0');
  const archetype = searchParams.get('a') || 'Unknown';
  const define = parseInt(searchParams.get('d') || '0');
  const check = parseInt(searchParams.get('c') || '0');
  const generate = parseInt(searchParams.get('g') || '0');
  const scale = parseInt(searchParams.get('sc') || '0');
  const displayName = searchParams.get('n') || username;

  const scoreColor = score >= 80 ? '#10B981' : score >= 60 ? '#0047FF' : score >= 40 ? '#F59E0B' : '#EF4444';

  function renderBar(value: number, max: number = 100) {
    const filled = Math.round((value / max) * 20);
    return '\u2588'.repeat(filled) + '\u2591'.repeat(20 - filled);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#000000',
          display: 'flex',
          flexDirection: 'column',
          padding: '48px 56px',
          fontFamily: 'monospace',
          position: 'relative',
        }}
      >
        {/* Scanline overlay effect */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 3px)',
            display: 'flex',
          }}
        />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ color: '#0047FF', fontSize: '14px', letterSpacing: '0.15em' }}>
              BRANDOS v2.0
            </div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>
              //
            </div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', letterSpacing: '0.1em' }}>
              BRAND DNA SCAN RESULTS
            </div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px', letterSpacing: '0.1em' }}>
            mybrandos.app
          </div>
        </div>

        {/* Separator */}
        <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px', marginBottom: '32px', display: 'flex' }}>
          {'/* ════════════════════════════════════════════════════════════════════ */'}
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', gap: '48px', flex: 1 }}>
          {/* Left: Score + Identity */}
          <div style={{ display: 'flex', flexDirection: 'column', width: '400px' }}>
            {/* Username */}
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', letterSpacing: '0.1em', marginBottom: '4px', display: 'flex' }}>
              {'> scanning @'}{username}
            </div>
            <div style={{ color: '#fff', fontSize: '28px', fontWeight: 600, marginBottom: '24px', display: 'flex' }}>
              {displayName}
            </div>

            {/* Score circle */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              marginBottom: '24px',
            }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '60px',
                border: `4px solid ${scoreColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
              }}>
                <div style={{ color: scoreColor, fontSize: '42px', fontWeight: 700, display: 'flex' }}>
                  {score}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.15em', display: 'flex' }}>
                  SCORE
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', letterSpacing: '0.15em', display: 'flex' }}>
                  ARCHETYPE
                </div>
                <div style={{ color: '#0047FF', fontSize: '20px', fontWeight: 600, display: 'flex', textTransform: 'uppercase' as const }}>
                  {archetype}
                </div>
              </div>
            </div>

            {/* Tier badge */}
            <div style={{
              display: 'flex',
              padding: '8px 16px',
              background: `${scoreColor}20`,
              border: `1px solid ${scoreColor}40`,
              borderRadius: '4px',
              width: 'fit-content',
            }}>
              <span style={{ color: scoreColor, fontSize: '12px', letterSpacing: '0.12em' }}>
                {score >= 80 ? 'ELITE' : score >= 70 ? 'STRONG' : score >= 60 ? 'SOLID' : score >= 50 ? 'BUILDING' : 'EMERGING'}
              </span>
            </div>
          </div>

          {/* Right: Phase breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '16px' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', letterSpacing: '0.12em', marginBottom: '8px', display: 'flex' }}>
              PHASE BREAKDOWN
            </div>

            {[
              { label: 'DEFINE', score: define, color: '#E8A838' },
              { label: 'CHECK', score: check, color: '#10B981' },
              { label: 'GENERATE', score: generate, color: '#9D4EDD' },
              { label: 'SCALE', score: scale, color: '#0047FF' },
            ].map((phase) => (
              <div key={phase.label} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ color: phase.color, fontSize: '12px', letterSpacing: '0.1em', width: '90px', display: 'flex' }}>
                  {phase.label}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '14px', flex: 1, display: 'flex', letterSpacing: '0.05em' }}>
                  {renderBar(phase.score)}
                </div>
                <div style={{ color: '#fff', fontSize: '16px', fontWeight: 600, width: '40px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end' }}>
                  {phase.score}
                </div>
              </div>
            ))}

            {/* CTA */}
            <div style={{
              marginTop: 'auto',
              display: 'flex',
              padding: '12px 20px',
              background: '#0047FF',
              borderRadius: '4px',
              width: 'fit-content',
            }}>
              <span style={{ color: '#fff', fontSize: '13px', letterSpacing: '0.12em' }}>
                GET YOUR SCORE → mybrandos.app
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', letterSpacing: '0.1em', display: 'flex' }}>
            {'// powered by AI brand intelligence'}
          </div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', letterSpacing: '0.1em', display: 'flex' }}>
            scan yours free at mybrandos.app
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
