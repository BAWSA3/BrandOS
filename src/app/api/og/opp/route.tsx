import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const u1 = searchParams.get('u1') || 'agent1';
  const u2 = searchParams.get('u2') || 'agent2';
  const s1 = parseInt(searchParams.get('s1') || '0');
  const s2 = parseInt(searchParams.get('s2') || '0');
  const a1 = searchParams.get('a1') || 'Unknown';
  const a2 = searchParams.get('a2') || 'Unknown';
  const d1 = parseInt(searchParams.get('d1') || '0');
  const d2 = parseInt(searchParams.get('d2') || '0');
  const c1 = parseInt(searchParams.get('c1') || '0');
  const c2 = parseInt(searchParams.get('c2') || '0');
  const g1 = parseInt(searchParams.get('g1') || '0');
  const g2 = parseInt(searchParams.get('g2') || '0');
  const sc1 = parseInt(searchParams.get('sc1') || '0');
  const sc2 = parseInt(searchParams.get('sc2') || '0');

  function threatColor(score: number) {
    if (score >= 80) return '#FF3333';
    if (score >= 60) return '#FFB800';
    if (score >= 40) return '#00FF88';
    return '#666666';
  }

  function threatLabel(score: number) {
    if (score >= 80) return 'LETHAL';
    if (score >= 60) return 'DANGEROUS';
    if (score >= 40) return 'MODERATE';
    return 'LOW RISK';
  }

  function renderBar(value: number, width: number = 12) {
    const filled = Math.round((value / 100) * width);
    return '\u2588'.repeat(filled) + '\u2591'.repeat(width - filled);
  }

  const phases = [
    { label: '◎ DEFINE', l: d1, r: d2 },
    { label: '◈ CHECK', l: c1, r: c2 },
    { label: '◆ GENERATE', l: g1, r: g2 },
    { label: '◉ SCALE', l: sc1, r: sc2 },
  ];

  const winner = s1 >= s2 ? u1 : u2;

  return new ImageResponse(
    <div
      style={{
        width: '1200px',
        height: '630px',
        background: '#060A0F',
        display: 'flex',
        flexDirection: 'column',
        padding: '36px 52px',
        fontFamily: 'monospace',
        position: 'relative',
      }}
    >
      {/* Grid overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage:
            'linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          display: 'flex',
        }}
      />

      {/* Scanline overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 3px)',
          display: 'flex',
        }}
      />

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(0,255,136,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00FF88', display: 'flex' }} />
          <div style={{ color: '#00FF88', fontSize: '13px', letterSpacing: '0.2em', display: 'flex' }}>
            BRANDOS
          </div>
          <div style={{ color: 'rgba(0,255,136,0.2)', fontSize: '13px', display: 'flex' }}>│</div>
          <div style={{ color: 'rgba(0,255,136,0.5)', fontSize: '12px', letterSpacing: '0.15em', display: 'flex' }}>
            OPP INTEL REPORT
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ color: 'rgba(255,51,51,0.5)', fontSize: '10px', letterSpacing: '0.15em', display: 'flex' }}>
            ■ CLASSIFIED
          </div>
          <div style={{ color: 'rgba(0,255,136,0.3)', fontSize: '11px', letterSpacing: '0.1em', display: 'flex' }}>
            mybrandos.app/opp
          </div>
        </div>
      </div>

      {/* Head to Head */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        {/* Agent 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px' }}>
          <div style={{ color: 'rgba(0,255,136,0.3)', fontSize: '9px', letterSpacing: '0.2em', marginBottom: '6px', display: 'flex' }}>
            AGENT
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex' }}>
            @{u1}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              marginBottom: '6px',
            }}
          >
            <div style={{ color: threatColor(s1), fontSize: '48px', fontWeight: 700, display: 'flex' }}>
              {s1}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                color: '#00FF88',
                fontSize: '12px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                display: 'flex',
              }}
            >
              {a1}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px', display: 'flex' }}>│</div>
            <div style={{ color: threatColor(s1), fontSize: '10px', letterSpacing: '0.1em', display: 'flex' }}>
              {threatLabel(s1)}
            </div>
          </div>
        </div>

        {/* VS */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <div
            style={{
              color: '#FF3333',
              fontSize: '36px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              display: 'flex',
            }}
          >
            VS
          </div>
        </div>

        {/* Agent 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '300px' }}>
          <div style={{ color: 'rgba(0,255,136,0.3)', fontSize: '9px', letterSpacing: '0.2em', marginBottom: '6px', display: 'flex' }}>
            TARGET
          </div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex' }}>
            @{u2}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              marginBottom: '6px',
            }}
          >
            <div style={{ color: threatColor(s2), fontSize: '48px', fontWeight: 700, display: 'flex' }}>
              {s2}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                color: '#00FF88',
                fontSize: '12px',
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                display: 'flex',
              }}
            >
              {a2}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px', display: 'flex' }}>│</div>
            <div style={{ color: threatColor(s2), fontSize: '10px', letterSpacing: '0.1em', display: 'flex' }}>
              {threatLabel(s2)}
            </div>
          </div>
        </div>
      </div>

      {/* Phase Comparison */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        {phases.map((phase) => {
          const lWins = phase.l >= phase.r;
          return (
            <div key={phase.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  color: 'rgba(0,255,136,0.5)',
                  fontSize: '11px',
                  letterSpacing: '0.08em',
                  width: '95px',
                  display: 'flex',
                }}
              >
                {phase.label}
              </div>
              <div
                style={{
                  color: lWins ? '#00FF88' : 'rgba(255,255,255,0.2)',
                  fontSize: '13px',
                  display: 'flex',
                  letterSpacing: '0.03em',
                }}
              >
                {renderBar(phase.l)}
              </div>
              <div
                style={{
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: lWins ? 700 : 400,
                  width: '28px',
                  textAlign: 'right',
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                {phase.l}
              </div>
              <div style={{ color: 'rgba(255,51,51,0.3)', fontSize: '11px', display: 'flex' }}>│</div>
              <div
                style={{
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: !lWins ? 700 : 400,
                  width: '28px',
                  display: 'flex',
                }}
              >
                {phase.r}
              </div>
              <div
                style={{
                  color: !lWins ? '#00FF88' : 'rgba(255,255,255,0.2)',
                  fontSize: '13px',
                  display: 'flex',
                  letterSpacing: '0.03em',
                }}
              >
                {renderBar(phase.r)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '14px',
          borderTop: '1px solid rgba(0,255,136,0.1)',
        }}
      >
        <div
          style={{
            color: 'rgba(0,255,136,0.4)',
            fontSize: '11px',
            letterSpacing: '0.1em',
            display: 'flex',
          }}
        >
          {'⊕ VERDICT: @'}{winner}{' TAKES THIS ONE'}
        </div>
        <div
          style={{
            display: 'flex',
            padding: '8px 16px',
            background: '#00FF88',
            borderRadius: '2px',
          }}
        >
          <span style={{ color: '#060A0F', fontSize: '11px', letterSpacing: '0.15em', fontWeight: 700 }}>
            FIND YOUR OPP → mybrandos.app/opp
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
