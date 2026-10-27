'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';
import { DASH_FONTS } from '@/components/dashboard/dashFonts';

/**
 * Dashboard v2 primitives. Every press responds at once: a 120ms press-in,
 * a spring release, a visible focus ring, 44px targets on phones. Under
 * reduced motion the press is a colour change only. Colours are `--v-*`
 * tokens (./tokens.ts), so nothing here knows which finish it is in.
 */

export const DISPLAY = `${DASH_FONTS.big}, 'Helvetica Neue', Helvetica, Arial, sans-serif`;
export const VCR = "'VCR OSD Mono', 'JetBrains Mono', ui-monospace, monospace";

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
export type BtnKind = 'primary' | 'cta' | 'secondary' | 'quiet' | 'on-signal';

const LOOK: Record<BtnKind, CSSProperties> = {
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

const BTN =
  'v2-focus inline-flex min-h-[44px] select-none items-center justify-center gap-2 px-4 text-[14px] leading-none disabled:opacity-40 md:min-h-[40px]';

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
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      whileTap={reduce ? undefined : PRESS}
      transition={RELEASE}
      className={`${BTN} ${className}`}
      style={{ fontFamily: DISPLAY, fontWeight: 500, borderRadius: 999, ...LOOK[kind], ...style }}
    >
      {children}
    </motion.button>
  );
}

/**
 * A link that looks and presses like Btn (navigation stays a real link:
 * middle-click, prefetch). The press is CSS (`.v2-press` in V2_CSS).
 */
export function ButtonLink({
  href,
  children,
  kind = 'secondary',
  className = '',
  style,
}: {
  href: string;
  children: ReactNode;
  kind?: BtnKind;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <Link
      href={href}
      className={`${BTN} v2-press ${className}`}
      style={{ fontFamily: DISPLAY, fontWeight: 500, borderRadius: 999, ...LOOK[kind], ...style }}
    >
      {children}
    </Link>
  );
}

/** A soft panel: the one container. */
export function Panel({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <section
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
    </section>
  );
}

/** Shell-wide styles: focus ring, the CSS press for links, selection colour. */
export const V2_CSS = `
  .v2-focus:focus-visible { outline: 2px solid var(--v-focus); outline-offset: 2px; }
  .v2-press { transition: transform 260ms cubic-bezier(.34,1.56,.64,1); }
  .v2-press:active { transform: scale(0.97) translateY(1px); transition-duration: 120ms; }
  @media (prefers-reduced-motion: reduce) {
    .v2-press, .v2-press:active { transition: none; transform: none; }
  }
  [data-finish] ::selection { background: var(--v-signal); color: var(--v-on-signal); }
`;
