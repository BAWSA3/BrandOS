'use client';

import { useEffect, useState } from 'react';

/**
 * ArchetypeCard — Uses pre-made template images as backgrounds,
 * overlays dynamic text (description, traits, rarity, strengths, PFP, handle).
 *
 * The template PNGs contain: background, 3D icon, archetype name,
 * MYBRANDOS.APP branding, and BrandOS logo.
 *
 * We overlay: User PFP, @handle, description text, trait values, rarity %, strength values.
 *
 * Each archetype has individual positioning so overlays align perfectly
 * with the baked-in archetype name on each template.
 *
 * Renders at 600x315 in DOM, captured at scale: 2 = 1200x630 output.
 */

interface ArchetypeCardProps {
  username: string;
  displayName: string;
  profileImageUrl?: string;
  archetype: string;
  description: string;
  traits: string[];
  rarity: number;
  strengths: string[];
}

// Archetype accent colors (matches archetype-descriptions.ts)
const ARCHETYPE_COLORS: Record<string, string> = {
  ARC: '#10B981',
  'BUILD.EXE': '#EF4444',
  ENTROPY: '#F59E0B',
  FORESIGHT: '#9D4EDD',
  FREQ: '#EC4899',
  NULL: '#8B5CF6',
  RELAY: '#06B6D4',
  SOURCE: '#3B82F6',
};

// Per-archetype layout config (px at 600x315 DOM scale)
interface CardLayout {
  left: number;       // left edge of description + pills (aligns with name)
  descTop: number;    // top of description text (clears below name)
  pillsBottom: number; // bottom offset for traits/rarity/strengths
}

const CARD_LAYOUTS: Record<string, CardLayout> = {
  ARC: {
    left: 270,
    descTop: 130,
    pillsBottom: 50,
  },
  'BUILD.EXE': {
    left: 250,
    descTop: 140,
    pillsBottom: 50,
  },
  ENTROPY: {
    left: 250,
    descTop: 140,
    pillsBottom: 50,
  },
  FORESIGHT: {
    left: 245,
    descTop: 140,
    pillsBottom: 50,
  },
  FREQ: {
    left: 250,
    descTop: 140,
    pillsBottom: 50,
  },
  NULL: {
    left: 270,
    descTop: 140,
    pillsBottom: 50,
  },
  RELAY: {
    left: 245,
    descTop: 135,
    pillsBottom: 50,
  },
  SOURCE: {
    left: 245,
    descTop: 135,
    pillsBottom: 50,
  },
};

const DEFAULT_LAYOUT: CardLayout = {
  left: 265,
  descTop: 135,
  pillsBottom: 50,
};

export default function ArchetypeCard({
  username,
  profileImageUrl,
  archetype,
  description,
  traits,
  rarity,
  strengths,
}: ArchetypeCardProps) {
  const font = "'VCR OSD Mono', 'Courier New', monospace";
  const layout = CARD_LAYOUTS[archetype] ?? DEFAULT_LAYOUT;
  const accentColor = ARCHETYPE_COLORS[archetype] ?? '#555';

  // Convert PFP to base64 data URL via proxy so it survives domToPng cloning
  const [pfpDataUrl, setPfpDataUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!profileImageUrl) return;
    const originalUrl = profileImageUrl.replace('_normal', '_200x200');
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(originalUrl)}`;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          setPfpDataUrl(canvas.toDataURL('image/png'));
        }
      } catch {
        // Fall back to original URL
      }
    };
    img.src = proxyUrl;
  }, [profileImageUrl]);

  return (
    <div
      id="archetype-card"
      data-archetype={archetype}
      style={{
        width: '600px',
        height: '315px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: font,
        textTransform: 'uppercase',
        backgroundImage: `url(/archetype-cards/${archetype}.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* ── Top-right: Handle + PFP (horizontal) ── */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          right: '20px',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <span style={{ fontSize: '8px', color: '#555', letterSpacing: '0.02em' }}>
          @{username}
        </span>
        {(pfpDataUrl || profileImageUrl) ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={pfpDataUrl || profileImageUrl?.replace('_normal', '_200x200') || ''}
            alt={username}
            width={24}
            height={24}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#ccc',
            }}
          />
        )}
      </div>

      {/* ── Description ── */}
      <div
        style={{
          position: 'absolute',
          left: `${layout.left}px`,
          top: `${layout.descTop}px`,
          right: '20px',
          fontSize: '8px',
          color: '#555',
          lineHeight: 1.6,
          letterSpacing: '0.03em',
        }}
      >
        {description}
      </div>

      {/* ── Bottom: Trait values + Rarity value + Strength values ── */}
      <div
        style={{
          position: 'absolute',
          bottom: `${layout.pillsBottom}px`,
          left: `${layout.left}px`,
          right: '20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '5px',
            fontSize: '8px',
            color: '#555',
            letterSpacing: '0.03em',
          }}
        >
          {traits.slice(0, 2).map((t) => (
            <span
              key={t}
              className="card-pill"
              style={{
                border: '1px solid rgba(0, 0, 0, 0.15)',
                padding: '2px 7px',
                borderRadius: '3px',
                color: '#444',
                transition: 'all 0.2s ease',
                cursor: 'default',
                whiteSpace: 'nowrap',
              }}
            >
              {t}
            </span>
          ))}
          <span
            className="card-pill-rarity"
            style={{
              background: accentColor,
              padding: '2px 7px',
              borderRadius: '3px',
              color: '#fff',
              fontWeight: 700,
              transition: 'all 0.2s ease',
              cursor: 'default',
            }}
          >
            TOP {rarity}%
          </span>
          {strengths.slice(0, 1).map((s) => (
            <span
              key={s}
              className="card-pill"
              style={{
                border: '1px solid rgba(0, 0, 0, 0.15)',
                padding: '2px 7px',
                borderRadius: '3px',
                color: '#444',
                transition: 'all 0.2s ease',
                cursor: 'default',
                whiteSpace: 'nowrap',
              }}
            >
              {s}
            </span>
          ))}
          <style>{`
            .card-pill:hover {
              transform: translateY(-1px) scale(1.05);
              border-color: ${accentColor} !important;
              color: ${accentColor} !important;
              box-shadow: 0 2px 8px ${accentColor}20;
            }
            .card-pill-rarity:hover {
              transform: translateY(-1px) scale(1.08);
              box-shadow: 0 2px 12px ${accentColor}40;
              filter: brightness(1.15);
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
