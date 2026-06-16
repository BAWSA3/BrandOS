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

  const phases = [
    { label: '◎ DEFINE', l: d1, r: d2 },
    { label: '◈ CHECK', l: c1, r: c2 },
    { label: '◆ GENERATE', l: g1, r: g2 },
    { label: '◉ SCALE', l: sc1, r: sc2 },
  ];

  return new ImageResponse(
    <div
      style={{
        width: '1200px',
        height: '630px',
        background: '#060A0F',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'monospace',
        position: 'relative',
      }}
    >
      {/* Grid overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundImage: 'linear-gradient(rgba(0,255,136,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,136,0.03) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          display: 'flex',
        }}
      />
      {/* Scanline */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 3px)',
          display: 'flex',
        }}
      />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 48px', borderBottom: '1px solid rgba(0,255,136,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00FF88', display: 'flex' }} />
          <div style={{ color: '#00FF88', fontSize: '14px', letterSpacing: '0.2em', display: 'flex' }}>BRANDOS</div>
          <div style={{ color: 'rgba(0,255,136,0.2)', fontSize: '14px', display: 'flex' }}>│</div>
          <div style={{ color: 'rgba(0,255,136,0.5)', fontSize: '13px', letterSpacing: '0.15em', display: 'flex' }}>OPP SCORECARD</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ color: 'rgba(255,51,51,0.5)', fontSize: '11px', letterSpacing: '0.15em', display: 'flex' }}>■ CLASSIFIED</div>
          <div style={{ color: 'rgba(0,255,136,0.3)', fontSize: '11px', letterSpacing: '0.1em', display: 'flex' }}>mybrandos.app/opp</div>
        </div>
      </div>

      {/* Fighter portraits + VS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '28px 80px 20px', flex: '0 0 auto' }}>
        {/* Left fighter */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '280px' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '12px', border: `3px solid ${threatColor(s1)}`, background: 'rgba(0,255,136,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <div style={{ color: 'rgba(0,255,136,0.3)', fontSize: '40px', display: 'flex' }}>◉</div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex' }}>@{u1}</div>
          <div style={{ color: threatColor(s1), fontSize: '52px', fontWeight: 700, lineHeight: '1', display: 'flex' }}>{s1}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <div style={{ color: '#00FF88', fontSize: '12px', letterSpacing: '0.08em', display: 'flex' }}>{a1.toUpperCase()}</div>
            <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px', display: 'flex' }}>│</div>
            <div style={{ color: threatColor(s1), fontSize: '11px', letterSpacing: '0.1em', display: 'flex' }}>{threatLabel(s1)}</div>
          </div>
        </div>

        {/* VS */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ color: '#FF3333', fontSize: '44px', fontWeight: 700, letterSpacing: '0.15em', display: 'flex' }}>VS</div>
        </div>

        {/* Right fighter */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '280px' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '12px', border: `3px solid ${threatColor(s2)}`, background: 'rgba(0,255,136,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <div style={{ color: 'rgba(0,255,136,0.3)', fontSize: '40px', display: 'flex' }}>◉</div>
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px', letterSpacing: '0.1em', marginBottom: '6px', display: 'flex' }}>@{u2}</div>
          <div style={{ color: threatColor(s2), fontSize: '52px', fontWeight: 700, lineHeight: '1', display: 'flex' }}>{s2}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
            <div style={{ color: '#00FF88', fontSize: '12px', letterSpacing: '0.08em', display: 'flex' }}>{a2.toUpperCase()}</div>
            <div style={{ color: 'rgba(255,255,255,0.15)', fontSize: '10px', display: 'flex' }}>│</div>
            <div style={{ color: threatColor(s2), fontSize: '11px', letterSpacing: '0.1em', display: 'flex' }}>{threatLabel(s2)}</div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', margin: '0 60px', height: '1px', background: 'linear-gradient(90deg, transparent, rgba(0,255,136,0.15), rgba(255,51,51,0.15), rgba(0,255,136,0.15), transparent)' }} />

      {/* Boxing Scorecard — centered */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', flex: 1, justifyContent: 'center' }}>
        <div style={{ color: 'rgba(0,255,136,0.3)', fontSize: '10px', letterSpacing: '0.15em', marginBottom: '12px', display: 'flex' }}>PHASE SCORECARD</div>

        {/* Column labels */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <div style={{ width: '100px', textAlign: 'right', color: 'rgba(255,255,255,0.25)', fontSize: '10px', letterSpacing: '0.08em', display: 'flex', justifyContent: 'flex-end' }}>@{u1.slice(0, 8).toUpperCase()}</div>
          <div style={{ width: '160px', textAlign: 'center', color: 'rgba(0,255,136,0.3)', fontSize: '10px', letterSpacing: '0.1em', display: 'flex', justifyContent: 'center' }}>ROUND</div>
          <div style={{ width: '100px', color: 'rgba(255,255,255,0.25)', fontSize: '10px', letterSpacing: '0.08em', display: 'flex' }}>@{u2.slice(0, 8).toUpperCase()}</div>
        </div>

        {/* Phase rows */}
        {phases.map((phase) => {
          const lWins = phase.l > phase.r;
          const rWins = phase.r > phase.l;
          const tie = phase.l === phase.r;
          return (
            <div key={phase.label} style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{
                width: '100px', textAlign: 'right', paddingRight: '20px', display: 'flex', justifyContent: 'flex-end',
                color: lWins ? '#00FF88' : tie ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
                fontSize: '20px', fontWeight: lWins ? 700 : 400,
              }}>{phase.l}</div>
              <div style={{
                width: '160px', textAlign: 'center', padding: '5px 0', display: 'flex', justifyContent: 'center',
                borderTop: '1px solid rgba(0,255,136,0.06)',
                borderBottom: '1px solid rgba(0,255,136,0.06)',
                background: 'rgba(0,255,136,0.02)',
              }}>
                <div style={{ color: 'rgba(0,255,136,0.5)', fontSize: '12px', letterSpacing: '0.12em', display: 'flex' }}>{phase.label}</div>
              </div>
              <div style={{
                width: '100px', paddingLeft: '20px', display: 'flex',
                color: rWins ? '#00FF88' : tie ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.25)',
                fontSize: '20px', fontWeight: rWins ? 700 : 400,
              }}>{phase.r}</div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px', borderTop: '1px solid rgba(0,255,136,0.1)' }}>
        <div style={{ display: 'flex', padding: '8px 20px', background: '#00FF88', borderRadius: '2px' }}>
          <span style={{ color: '#060A0F', fontSize: '12px', letterSpacing: '0.15em', fontWeight: 700 }}>FIND YOUR OPP → MYBRANDOS.APP/OPP</span>
        </div>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    }
  );
}
