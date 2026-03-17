import Image from 'next/image';

const ARCHETYPES = [
  {
    name: 'ARC',
    tier: 1,
    tierLabel: 'ENTRY',
    tagline: 'Rising star. Growth story.',
    color: '#10B981',
  },
  {
    name: 'ENTROPY',
    tier: 2,
    tierLabel: 'RISING',
    tagline: 'Risk-taker. Cult builder.',
    color: '#F59E0B',
  },
  {
    name: 'NULL',
    tier: 2,
    tierLabel: 'RISING',
    tagline: 'Ideas over identity.',
    color: '#8B5CF6',
  },
  {
    name: 'FREQ',
    tier: 2,
    tierLabel: 'RISING',
    tagline: 'Entertainer. Community builder.',
    color: '#EC4899',
  },
  {
    name: 'RELAY',
    tier: 3,
    tierLabel: 'ADVANCED',
    tagline: 'Super connector.',
    color: '#06B6D4',
  },
  {
    name: 'BUILD.EXE',
    tier: 3,
    tierLabel: 'ADVANCED',
    tagline: 'Builder. Shipper. Doer.',
    color: '#EF4444',
  },
  {
    name: 'SIGNAL_SAGE',
    tier: 4,
    tierLabel: 'EXPERT',
    tagline: 'Knowledge authority.',
    color: '#3B82F6',
  },
  {
    name: 'FORESIGHT',
    tier: 5,
    tierLabel: 'PEAK',
    tagline: 'Shapes the narrative.',
    color: '#9D4EDD',
  },
];

export const metadata = {
  title: 'BrandOS Archetypes',
  description: 'The 8 BrandOS creator archetypes — discover which one you are.',
};

export default function ArchetypesPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050505',
        color: '#fff',
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* Header */}
      <div style={{ padding: '48px 24px 24px', textAlign: 'center' }}>
        <p
          style={{
            fontSize: '11px',
            letterSpacing: '0.2em',
            color: '#555',
            marginBottom: '12px',
          }}
        >
          BRANDOS_ARCHETYPES
        </p>
        <h1
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 900,
            fontStyle: 'italic',
            margin: '0 0 12px',
          }}
        >
          The 8 Archetypes
        </h1>
        <p style={{ fontSize: '13px', color: '#888', maxWidth: '500px', margin: '0 auto' }}>
          Every creator falls into one of these brand identities. Which one are you?
        </p>
      </div>

      {/* Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '24px',
          padding: '32px 24px 64px',
          maxWidth: '1100px',
          margin: '0 auto',
        }}
      >
        {ARCHETYPES.map((a) => (
          <div
            key={a.name}
            style={{
              background: '#111',
              border: '1px solid #222',
              borderRadius: '8px',
              padding: '32px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              transition: 'border-color 0.2s',
            }}
          >
            {/* Tier badge */}
            <span
              style={{
                fontSize: '9px',
                letterSpacing: '0.15em',
                color: a.color,
                border: `1px solid ${a.color}40`,
                padding: '3px 10px',
                borderRadius: '2px',
                marginBottom: '20px',
              }}
            >
              TIER {a.tier} — {a.tierLabel}
            </span>

            {/* Icon */}
            <div style={{ width: '120px', height: '120px', marginBottom: '20px', position: 'relative' }}>
              <Image
                src={`/archetypes/${a.name}.png`}
                alt={a.name}
                width={120}
                height={120}
                style={{ objectFit: 'contain' }}
              />
            </div>

            {/* Name */}
            <h2
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '22px',
                fontWeight: 800,
                fontStyle: 'italic',
                margin: '0 0 8px',
                color: a.color,
              }}
            >
              {a.name}
            </h2>

            {/* Tagline */}
            <p style={{ fontSize: '12px', color: '#888', margin: 0 }}>{a.tagline}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '0 24px 64px' }}>
        <a
          href="/"
          style={{
            display: 'inline-block',
            padding: '14px 32px',
            background: '#2E6AFF',
            color: '#fff',
            borderRadius: '4px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textDecoration: 'none',
          }}
        >
          DISCOVER YOUR ARCHETYPE
        </a>
      </div>
    </div>
  );
}
