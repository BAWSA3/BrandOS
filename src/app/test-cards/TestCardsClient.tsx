'use client';

import { useState, useCallback } from 'react';
import { ARCHETYPE_DATA } from '@/lib/archetype-descriptions';
import ArchetypeCard from '@/components/ArchetypeCard';
import { domToPng } from 'modern-screenshot';

export default function TestCardsClient() {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadedAll, setDownloadedAll] = useState(false);

  const downloadCard = useCallback(async (archetypeName: string) => {
    // Find the card by its data attribute
    const card = document.querySelector(`[data-archetype="${archetypeName}"]`) as HTMLElement;
    if (!card) return;

    setDownloading(archetypeName);
    try {
      const dataUrl = await domToPng(card, { scale: 2, quality: 1, timeout: 30000 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `brandos-${archetypeName.toLowerCase()}-bawsaxbt.png`;
      a.click();
    } catch (err) {
      console.error(`Failed to download ${archetypeName}:`, err);
    }
    setDownloading(null);
  }, []);

  const downloadAll = useCallback(async () => {
    setDownloadedAll(false);
    for (const name of Object.keys(ARCHETYPE_DATA)) {
      await downloadCard(name);
      // Small delay between downloads so browser doesn't block them
      await new Promise(r => setTimeout(r, 500));
    }
    setDownloadedAll(true);
  }, [downloadCard]);

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0C', padding: '40px 24px' }}>
      <h1 style={{ color: '#fff', textAlign: 'center', marginBottom: '8px', fontFamily: 'Inter, sans-serif', fontWeight: 900, fontStyle: 'italic' }}>
        Archetype Reveal Cards
      </h1>
      <p style={{ color: '#555', textAlign: 'center', marginBottom: '32px', fontFamily: "'JetBrains Mono', monospace", fontSize: '12px' }}>
        @bawsaxbt — all 8 archetypes
      </p>

      {/* Download All Button */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <button
          onClick={downloadAll}
          disabled={!!downloading}
          style={{
            padding: '14px 36px',
            background: '#0047FF',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '13px',
            fontWeight: 700,
            letterSpacing: '0.05em',
            cursor: downloading ? 'wait' : 'pointer',
            opacity: downloading ? 0.5 : 1,
          }}
        >
          {downloading ? `DOWNLOADING ${downloading}...` : downloadedAll ? '✓ ALL DOWNLOADED' : 'DOWNLOAD ALL 8 CARDS'}
        </button>
      </div>

      {/* All 8 Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '640px', margin: '0 auto' }}>
        {Object.values(ARCHETYPE_DATA).map((a) => (
          <div key={a.name}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <p style={{ color: '#888', fontSize: '11px', fontFamily: "'JetBrains Mono', monospace", margin: 0 }}>
                {a.emoji} {a.name} — TIER {a.tier} {a.tierLabel}
              </p>
              <button
                onClick={() => downloadCard(a.name)}
                disabled={!!downloading}
                style={{
                  padding: '4px 12px',
                  background: 'none',
                  border: '1px solid #333',
                  borderRadius: '4px',
                  color: '#666',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                {downloading === a.name ? '...' : 'DOWNLOAD'}
              </button>
            </div>
            <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #222' }}>
              <ArchetypeCard
                username="bawsaxbt"
                displayName="Bawsa"
                profileImageUrl="https://pbs.twimg.com/profile_images/2012275361313341440/z_3TmoPc_normal.jpg"
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
  );
}
