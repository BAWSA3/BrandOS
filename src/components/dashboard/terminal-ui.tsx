'use client';

import { motion } from 'motion/react';

// Shared terminal-aesthetic primitives for dashboard surfaces (setup wizard,
// DNA editor). Everything themes through world CSS variables only.

export const MONO = "'VCR OSD Mono', 'JetBrains Mono', monospace";

export function asciiBar(progress: number, width = 16) {
  const filled = Math.round((progress / 100) * width);
  return `[${'█'.repeat(filled)}${'░'.repeat(width - filled)}]`;
}

export const terminalInputStyle: React.CSSProperties = {
  fontFamily: MONO,
  backgroundColor: 'var(--surface-tertiary)',
  border: '1px solid var(--border)',
  borderRadius: 2,
  color: 'var(--text-primary)',
  outline: 'none',
};

export function Cursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.6, repeat: Infinity }}
      style={{ color: 'var(--accent)' }}
    >
      █
    </motion.span>
  );
}

/* Terminal-styled action button: [ LABEL ] */
export function TerminalButton({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-5 py-2.5 text-sm transition-all hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        fontFamily: MONO,
        letterSpacing: '0.08em',
        border: '1px solid',
        borderColor: primary ? 'var(--accent)' : 'var(--border)',
        backgroundColor: primary
          ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
          : 'transparent',
        color: primary ? 'var(--accent)' : 'var(--text-secondary)',
        borderRadius: 2,
      }}
    >
      {children}
    </button>
  );
}

/* ASCII tone slider: a native range input drives the bar, so it's keyboard
   accessible for free — the visible bar is pure text. */
export function ToneSlider({
  label,
  value,
  onChange,
  left,
  right,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  left: string;
  right: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span
          style={{
            fontFamily: MONO,
            fontSize: 10,
            letterSpacing: '0.15em',
            color: 'var(--text-tertiary)',
          }}
        >
          {label}
        </span>
        <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--accent)' }}>{value}</span>
      </div>
      <div className="relative select-none">
        <span
          aria-hidden
          className="block whitespace-pre text-sm sm:text-base"
          style={{ fontFamily: MONO, color: 'var(--accent)' }}
        >
          {asciiBar(value, 28)}
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={value}
          aria-label={label}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      <div className="flex justify-between mt-0.5">
        <span style={{ fontFamily: MONO, fontSize: 9, color: 'var(--text-tertiary)' }}>{left}</span>
        <span style={{ fontFamily: MONO, fontSize: 9, color: 'var(--text-tertiary)' }}>
          {right}
        </span>
      </div>
    </div>
  );
}

export const TONE_SLIDERS = [
  { key: 'minimal' as const, label: 'FORMALITY', left: 'casual', right: 'formal' },
  { key: 'playful' as const, label: 'ENERGY', left: 'reserved', right: 'energetic' },
  { key: 'bold' as const, label: 'CONFIDENCE', left: 'humble', right: 'bold' },
  { key: 'experimental' as const, label: 'STYLE', left: 'classic', right: 'experimental' },
];
