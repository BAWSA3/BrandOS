'use client';

import { ProfileType } from '../types';
import { PROFILES } from '../lib/data';

const colorMap = {
  blue: { bg: 'rgba(0,71,255,0.08)', text: '#0047FF', border: 'rgba(0,71,255,0.15)' },
  green: { bg: 'rgba(16,185,129,0.08)', text: '#10B981', border: 'rgba(16,185,129,0.15)' },
  amber: { bg: 'rgba(245,158,11,0.08)', text: '#F59E0B', border: 'rgba(245,158,11,0.15)' },
  red: { bg: 'rgba(239,68,68,0.08)', text: '#EF4444', border: 'rgba(239,68,68,0.15)' },
};

const profileColor: Record<ProfileType, keyof typeof colorMap> = {
  intuitive: 'blue',
  grinder: 'amber',
  builder: 'green',
};

export default function ProfileBanner({ profile }: { profile: ProfileType }) {
  const meta = PROFILES[profile];
  const c = colorMap[profileColor[profile]];

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 4,
        border: '1px solid rgba(0,0,0,0.08)',
        borderLeft: `3px solid ${c.text}`,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <span
        style={{
          fontFamily: "'VCR OSD Mono', monospace",
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: c.text,
          background: c.bg,
          border: `1px solid ${c.border}`,
          borderRadius: 4,
          padding: '4px 10px',
          whiteSpace: 'nowrap',
        }}
      >
        {profile}
      </span>

      <div style={{ flex: 1 }}>
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Helvetica', sans-serif",
            fontSize: 16,
            fontWeight: 600,
            color: 'rgba(0,0,0,0.85)',
            marginBottom: 4,
          }}
        >
          {meta.name}
        </div>
        <div
          style={{
            fontFamily: "'Helvetica Neue', 'Helvetica', sans-serif",
            fontSize: 14,
            color: 'rgba(0,0,0,0.5)',
            lineHeight: 1.5,
          }}
        >
          {meta.description}
        </div>
      </div>
    </div>
  );
}
