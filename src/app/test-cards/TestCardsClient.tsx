'use client';

import { useState } from 'react';
import { ARCHETYPE_DATA } from '@/lib/archetype-descriptions';
import ArchetypeCard from '@/components/ArchetypeCard';

export default function TestCardsClient() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [cardImages, setCardImages] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const generateCard = async (name: string) => {
    setGenerating(name);
    try {
      const { generateArchetypeImage } = await import('@/components/ShareableArchetypeCard');
      const info = ARCHETYPE_DATA[name];
      const blob = await generateArchetypeImage({
        username: 'testuser',
        displayName: 'Test User',
        archetype: info.name,
        emoji: info.emoji,
        tagline: info.tagline,
        description: info.description,
        tier: info.tier,
        tierLabel: info.tierLabel,
        color: info.color,
        rarity: info.rarity,
        traits: info.traits,
        strengths: info.strengths,
      });
      if (blob) {
        setCardImages((prev) => ({ ...prev, [name]: URL.createObjectURL(blob) }));
      }
    } catch (err) {
      console.error(`Failed: ${name}`, err);
      setErrors((prev) => ({ ...prev, [name]: String(err) }));
    }
    setGenerating(null);
  };

  const generateAll = async () => {
    for (const name of Object.keys(ARCHETYPE_DATA)) {
      await generateCard(name);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0C', padding: '40px 24px' }}>
      <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: '24px', fontFamily: 'Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}>
        Archetype Share Cards
      </h1>

      {/* DOM Card Previews */}
      <div style={{ marginBottom: '60px' }}>
        <h2 style={{ color: '#fff', textAlign: 'center', marginBottom: '24px', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', letterSpacing: '0.1em' }}>
          DOM CARD PREVIEWS (TEMPLATE + OVERLAY)
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '640px', margin: '0 auto' }}>
          {Object.values(ARCHETYPE_DATA).map((a) => (
            <div key={`dom-${a.name}`}>
              <p style={{ color: '#888', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '6px' }}>
                {a.emoji} {a.name} — TIER {a.tier} {a.tierLabel}
              </p>
              <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #222' }}>
                <ArchetypeCard
                  username="bawsaxbt"
                  displayName="Bawsa"
                  profileImageUrl="https://pbs.twimg.com/profile_images/1830398866424266752/iuKVRMBl_200x200.jpg"
                  archetype={a.name}
                  description={a.description}
                  traits={a.traits}
                  rarity={a.rarity}
                  strengths={a.strengths}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid #222', margin: '40px 0' }} />

      {/* Canvas-generated cards */}
      <h2 style={{ color: '#fff', textAlign: 'center', marginBottom: '24px', fontFamily: "'JetBrains Mono', monospace", fontSize: '14px', letterSpacing: '0.1em' }}>
        CANVAS-GENERATED CARDS
      </h2>

      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <button
          onClick={generateAll}
          disabled={!!generating}
          style={{
            padding: '12px 32px',
            background: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: '6px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            fontWeight: 700,
            cursor: generating ? 'wait' : 'pointer',
            opacity: generating ? 0.5 : 1,
          }}
        >
          {generating ? `GENERATING ${generating}...` : 'GENERATE ALL 8 CARDS'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
        {Object.values(ARCHETYPE_DATA).map((a) => (
          <div key={a.name}>
            <p style={{ color: '#888', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '6px' }}>
              {a.emoji} {a.name} — TIER {a.tier} {a.tierLabel}
            </p>
            {errors[a.name] && (
              <p style={{ color: '#EF4444', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", marginBottom: '6px', wordBreak: 'break-all' }}>
                ERROR: {errors[a.name]}
              </p>
            )}
            {cardImages[a.name] ? (
              <img src={cardImages[a.name]} alt={a.name} style={{ width: '100%', borderRadius: '8px', border: '1px solid #222' }} />
            ) : (
              <div style={{ width: '100%', aspectRatio: '1200/630', background: '#111', borderRadius: '8px', border: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <button
                  onClick={() => generateCard(a.name)}
                  disabled={!!generating}
                  style={{ padding: '8px 16px', background: 'none', border: '1px solid #333', borderRadius: '4px', color: '#555', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', cursor: 'pointer' }}
                >
                  Generate {a.name}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
