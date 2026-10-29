'use client';

import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';
import { DASH_FONTS } from '@/components/dashboard/dashFonts';

/**
 * Dashboard v2 primitives (mockup). Every press responds at once: a 120ms
 * press-in, a spring release, a visible focus ring, 44px targets on phones.
 * Under reduced motion the press is a colour change only.
 */

export const DISPLAY = `${DASH_FONTS.big}, 'Helvetica Neue', Helvetica, Arial, sans-serif`;
export const VCR = "'VCR OSD Mono', 'JetBrains Mono', ui-monospace, monospace";
export const DATA = "'JetBrains Mono', ui-monospace, monospace";

const PRESS = { scale: 0.97, y: 1 };
const RELEASE = { type: 'spring' as const, stiffness: 520, damping: 30, mass: 0.6 };

/** VCR micro-label: the section marker. Kept where it names a section, cut where it repeats the UI. */
export function Label({
  children,
  tone = 'muted',
  className = '',
  style,
}: {
  children: ReactNode;
  tone?: 'muted' | 'ink' | 'signal' | 'head' | 'head-muted' | 'on-signal';
  className?: string;
  style?: CSSProperties;
}) {
  const color = {
    muted: 'var(--v-muted)',
    ink: 'var(--v-ink)',
    signal: 'var(--v-signal-text)',
    head: 'var(--v-head)',
    'head-muted': 'var(--v-head-muted)',
    'on-signal': 'var(--v-on-signal)',
  }[tone];
  return (
    <div
      className={`text-[10px] uppercase tracking-[0.16em] ${className}`}
      style={{ fontFamily: VCR, color, ...style }}
    >
      {children}
    </div>
  );
}

/** `cta` = the primary action when it sits on the page canvas (white on the Klein finish). */
type BtnKind = 'primary' | 'cta' | 'secondary' | 'quiet' | 'on-signal';

export function Btn({
  children,
  onClick,
  kind = 'secondary',
  className = '',
  style,
  title,
  ariaLabel,
  type = 'button',
  disabled,
  kbd,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: BtnKind;
  className?: string;
  style?: CSSProperties;
  title?: string;
  ariaLabel?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  /** keyboard hint shown on desktop only */
  kbd?: string;
}) {
  const reduce = useReducedMotion();
  const look: Record<BtnKind, CSSProperties> = {
    primary: { background: 'var(--v-signal)', color: 'var(--v-on-signal)' },
    cta: { background: 'var(--v-cta)', color: 'var(--v-cta-ink)' },
    secondary: {
      background: 'var(--v-raised)',
      color: 'var(--v-ink)',
      boxShadow: 'inset 0 0 0 1px var(--v-rule)',
    },
    quiet: { background: 'transparent', color: 'var(--v-muted)' },
    'on-signal': { background: 'var(--v-on-signal)', color: 'var(--v-signal)' },
  };
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      whileTap={reduce ? undefined : PRESS}
      transition={RELEASE}
      className={`v2-focus inline-flex min-h-[44px] select-none items-center justify-center gap-2 px-4 text-[14px] leading-none disabled:opacity-40 md:min-h-[40px] ${className}`}
      style={{ fontFamily: DISPLAY, fontWeight: 500, borderRadius: 999, ...look[kind], ...style }}
    >
      {children}
      {kbd && (
        <span
          className="hidden text-[10px] tracking-[0.1em] opacity-70 md:inline"
          style={{ fontFamily: VCR }}
        >
          {kbd}
        </span>
      )}
    </motion.button>
  );
}

/** A soft panel: the one container. Bone on Bone, a raised tile on Night. */
export function Panel({
  children,
  className = '',
  style,
  as = 'section',
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  as?: 'section' | 'div' | 'article';
}) {
  const Tag = as;
  return (
    <Tag
      className={className}
      style={{
        background: 'var(--v-surface)',
        color: 'var(--v-ink)',
        borderRadius: 18,
        boxShadow: 'inset 0 0 0 1px var(--v-rule)',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

/** Keyboard hint chip. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd
      className="inline-flex h-[20px] min-w-[20px] items-center justify-center px-1.5 text-[10px]"
      style={{
        fontFamily: VCR,
        borderRadius: 5,
        boxShadow: 'inset 0 0 0 1px currentColor',
        color: 'inherit',
        opacity: 0.75,
      }}
    >
      {children}
    </kbd>
  );
}

/** The mockup note under each screen: principle + what got cut. */
export function MockNote({ principle, cut }: { principle: string; cut: string }) {
  return (
    <aside
      data-mock-note
      className="mx-auto mt-16 max-w-[720px] px-4 pb-6 text-[12px] leading-[1.6]"
      style={{ color: 'var(--v-head-muted)' }}
    >
      <span style={{ fontFamily: VCR, letterSpacing: '0.14em' }}>MOCKUP NOTE / </span>
      <strong style={{ color: 'var(--v-head)', fontWeight: 500 }}>Principle:</strong> {principle}{' '}
      <strong style={{ color: 'var(--v-head)', fontWeight: 500 }}>Cut:</strong> {cut}
    </aside>
  );
}
