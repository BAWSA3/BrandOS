'use client';

import { VoiceFingerprint } from '@/lib/voice-fingerprint';

interface VoiceFingerprintMiniProps {
  fingerprint: VoiceFingerprint | null;
  onClick?: () => void;
}

export default function VoiceFingerprintMini({
  fingerprint,
  onClick,
}: VoiceFingerprintMiniProps) {
  if (!fingerprint) {
    return (
      <button
        onClick={onClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          fontSize: 12,
          color: 'var(--text-tertiary)',
          background: 'var(--surface)',
          border: '1px dashed var(--border)',
          borderRadius: 20,
          cursor: 'pointer',
          transition: 'all 150ms ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--text-secondary)';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--border)';
          e.currentTarget.style.color = 'var(--text-tertiary)';
        }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
        No Voice Print
      </button>
    );
  }

  const confidence = fingerprint.metadata.confidence;
  const color =
    confidence >= 70
      ? 'var(--success, #34C759)'
      : confidence >= 40
        ? '#FF9F0A'
        : 'var(--text-tertiary)';

  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        fontSize: 12,
        color,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 20,
        cursor: 'pointer',
        transition: 'all 150ms ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--surface-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--surface)';
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
      Voice Print
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: color,
        }}
      />
      <span style={{ fontWeight: 600 }}>{confidence}%</span>
    </button>
  );
}
