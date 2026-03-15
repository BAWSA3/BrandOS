'use client';

import Image from 'next/image';

const archetypes = [
  {
    name: 'ARC',
    tier: 1,
    tierLabel: 'ENTRY',
    tagline: 'Rising star. Growth story.',
    color: '#10B981',
    rarity: 20,
  },
  {
    name: 'ENTROPY',
    tier: 2,
    tierLabel: 'RISING',
    tagline: 'Risk-taker. Cult builder.',
    color: '#F59E0B',
    rarity: 10,
  },
  {
    name: 'NULL',
    tier: 2,
    tierLabel: 'RISING',
    tagline: 'Ideas over identity.',
    color: '#8B5CF6',
    rarity: 11,
  },
  {
    name: 'FREQ',
    tier: 2,
    tierLabel: 'RISING',
    tagline: 'Entertainer. Community builder.',
    color: '#EC4899',
    rarity: 18,
  },
  {
    name: 'RELAY',
    tier: 3,
    tierLabel: 'ADVANCED',
    tagline: 'Super connector.',
    color: '#06B6D4',
    rarity: 8,
  },
  {
    name: 'BUILD.EXE',
    tier: 3,
    tierLabel: 'ADVANCED',
    tagline: 'Builder. Shipper. Doer.',
    color: '#EF4444',
    rarity: 15,
  },
  {
    name: 'SIGNAL_SAGE',
    tier: 4,
    tierLabel: 'EXPERT',
    tagline: 'Knowledge authority.',
    color: '#3B82F6',
    rarity: 12,
  },
  {
    name: 'FORESIGHT',
    tier: 5,
    tierLabel: 'PEAK',
    tagline: 'Shapes the narrative.',
    color: '#9D4EDD',
    rarity: 6,
  },
];

const shimmerKeyframes = `
@keyframes metalShine {
  0% { transform: translateX(-100%) rotate(25deg); }
  100% { transform: translateX(200%) rotate(25deg); }
}
`;

export default function TestArchetypesPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F2F0EF',
      padding: '48px 24px',
      fontFamily: "'VCR OSD Mono', 'JetBrains Mono', monospace",
    }}>
      <style>{shimmerKeyframes}</style>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 700,
            color: '#1D1D1F',
            letterSpacing: '0.05em',
            marginBottom: 8,
          }}>
            BRANDOS ARCHETYPES
          </h1>
          <p style={{
            fontSize: 14,
            color: '#86868B',
            letterSpacing: '0.1em',
          }}>
            8 CREATOR ARCHETYPES — TIER 1 → 5
          </p>
        </div>

        {/* Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: 24,
        }}>
          {archetypes.map((arch, idx) => (
            <div
              key={arch.name}
              style={{
                background: '#FFFFFF',
                borderRadius: 16,
                padding: 24,
                border: `1px solid rgba(0, 0, 0, 0.08)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
                transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                cursor: 'default',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 8px 32px ${arch.color}30`;
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Tier badge */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                alignItems: 'center',
              }}>
                <span style={{
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  color: arch.color,
                  fontWeight: 700,
                  background: `${arch.color}15`,
                  padding: '4px 10px',
                  borderRadius: 999,
                }}>
                  TIER {arch.tier} — {arch.tierLabel}
                </span>
                <span style={{
                  fontSize: 10,
                  letterSpacing: '0.1em',
                  color: '#86868B',
                }}>
                  {arch.rarity}% RARITY
                </span>
              </div>

              {/* SVG Icon with metal polish effect */}
              <div style={{
                width: 160,
                height: 160,
                position: 'relative',
                borderRadius: 16,
                overflow: 'hidden',
              }}>
                <Image
                  src={`/archetypes/${arch.name}.svg`}
                  alt={arch.name}
                  fill
                  style={{
                    objectFit: 'contain',
                    filter: 'contrast(1.1) brightness(1.05) saturate(0.85)',
                  }}
                />
                {/* Metal sheen overlay */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.25) 45%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.25) 55%, transparent 70%)',
                  mixBlendMode: 'overlay',
                  pointerEvents: 'none',
                }} />
                {/* Animated shine sweep */}
                <div style={{
                  position: 'absolute',
                  inset: -20,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0) 35%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0) 65%, transparent 100%)',
                  animation: 'metalShine 3s ease-in-out infinite',
                  animationDelay: `${idx * 0.4}s`,
                  pointerEvents: 'none',
                }} />
                {/* Subtle chrome edge highlight */}
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 16,
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.1)',
                  pointerEvents: 'none',
                }} />
              </div>

              {/* Name */}
              <h2 style={{
                fontSize: 20,
                fontWeight: 700,
                color: '#1D1D1F',
                letterSpacing: '0.08em',
                textAlign: 'center',
              }}>
                {arch.name}
              </h2>

              {/* Tagline */}
              <p style={{
                fontSize: 12,
                color: '#6E6E73',
                textAlign: 'center',
                letterSpacing: '0.05em',
                lineHeight: 1.5,
              }}>
                {arch.tagline}
              </p>

              {/* Color bar */}
              <div style={{
                width: '100%',
                height: 3,
                background: `linear-gradient(90deg, transparent, ${arch.color}, transparent)`,
                borderRadius: 2,
              }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
