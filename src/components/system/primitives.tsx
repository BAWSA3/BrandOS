'use client';

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
} from 'react';
import { FIELD_FONTS } from '@/components/field/fieldFonts';
import { BONE, HAIRLINE, INK } from '@/lib/field/system';
import { FIELD, SIGNAL } from '@/lib/field/dither';

/**
 * The system's primitives (docs/BRAND-WORLD.md, Direction 03). Everything sits
 * either directly on the field (white, `tone="field"`) or on a bone panel
 * (ink, `tone="bone"`). Coral is only ever a fill for "this one", never text
 * on Klein. Opt-in: existing components are untouched.
 *
 * Motion is the system's vocabulary: press (scale in, no overshoot) and cut.
 * Nothing fades in or out.
 */

export const SYSTEM_FONTS = {
  display: "'Helvetica Custom', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  vcr: "'VCR OSD Mono', 'JetBrains Mono', monospace",
  plex: FIELD_FONTS.plex,
};

export type Tone = 'field' | 'bone';

const PRESS = 'transform 140ms cubic-bezier(.16,1,.3,1)';

/** Shared keyframes and focus styles for the system (rendered once per page). */
export function SystemStyles() {
  return (
    <style>{`
      @keyframes sys-press { from { transform: scale(1.04); } to { transform: scale(1); } }
      @keyframes sys-slide { from { transform: translateX(110%); } to { transform: translateX(0); } }
      .sys-press:active { transform: scale(.97); }
      .sys-focus:focus-visible { outline: 2px solid ${FIELD}; outline-offset: 2px; }
      .sys-focus-field:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
      .sys-input::placeholder { font-family: ${FIELD_FONTS.plex}; color: rgba(14,14,14,.45); }
      @media (prefers-reduced-motion: reduce) {
        .sys-anim { animation: none !important; }
        .sys-press:active { transform: none; }
      }
    `}</style>
  );
}

/** A bone panel placed on the field: where long reading lives. */
export function Panel({
  label,
  meta,
  children,
  padding = 28,
  style,
  className,
  as: As = 'section',
}: {
  label?: string;
  meta?: string;
  children: ReactNode;
  padding?: number;
  style?: CSSProperties;
  className?: string;
  as?: 'section' | 'div' | 'article' | 'aside';
}) {
  return (
    <As
      className={className}
      style={{
        background: BONE,
        color: INK,
        border: `1px solid ${HAIRLINE}`,
        padding,
        minWidth: 0,
        ...style,
      }}
    >
      {(label || meta) && (
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            paddingBottom: 12,
            marginBottom: 18,
            borderBottom: `1px solid ${HAIRLINE}`,
            fontFamily: SYSTEM_FONTS.vcr,
            fontSize: 11,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(14,14,14,.62)',
          }}
        >
          <span>{label}</span>
          {meta && (
            <span style={{ fontFamily: SYSTEM_FONTS.plex, letterSpacing: '.04em' }}>{meta}</span>
          )}
        </header>
      )}
      {children}
    </As>
  );
}

/** A card is a smaller panel. */
export const Card = Panel;

/**
 * Text set directly on the field. Small text (label, mono) sits on a Klein
 * backing so the dots never cut through it, like the loop video.
 */
export function FieldText({
  size = 'body',
  as,
  children,
  style,
}: {
  size?: 'display' | 'title' | 'body' | 'mono' | 'label';
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'div' | 'span';
  children: ReactNode;
  style?: CSSProperties;
}) {
  const backed = size === 'mono' || size === 'label' || size === 'body';
  // Big type keeps a crisp 2px Klein edge (no blur) so dense dots never cut into it.
  const edge =
    size === 'display' || size === 'title'
      ? `2px 0 ${FIELD}, -2px 0 ${FIELD}, 0 2px ${FIELD}, 0 -2px ${FIELD}, 2px 2px ${FIELD}, -2px -2px ${FIELD}, 2px -2px ${FIELD}, -2px 2px ${FIELD}`
      : undefined;
  const As = as ?? (size === 'display' ? 'h1' : size === 'title' ? 'h2' : 'p');
  const type: Record<string, CSSProperties> = {
    display: {
      fontFamily: SYSTEM_FONTS.display,
      fontWeight: 700,
      fontSize: 'clamp(48px, 9vw, 168px)',
      lineHeight: 0.92,
      letterSpacing: '-0.045em',
    },
    title: {
      fontFamily: SYSTEM_FONTS.display,
      fontWeight: 700,
      fontSize: 'clamp(28px, 4vw, 52px)',
      lineHeight: 1,
      letterSpacing: '-0.03em',
    },
    body: { fontFamily: SYSTEM_FONTS.display, fontSize: 17, lineHeight: 1.55 },
    mono: { fontFamily: SYSTEM_FONTS.plex, fontSize: 14, lineHeight: 1.6 },
    label: {
      fontFamily: SYSTEM_FONTS.vcr,
      fontSize: 12,
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
    },
  };
  return (
    <As style={{ color: '#fff', margin: 0, textShadow: edge, ...type[size], ...style }}>
      {backed ? (
        <span
          style={{
            background: FIELD,
            boxDecorationBreak: 'clone',
            WebkitBoxDecorationBreak: 'clone',
            padding: '2px 6px',
          }}
        >
          {children}
        </span>
      ) : (
        children
      )}
    </As>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  tone?: Tone;
  variant?: 'primary' | 'secondary' | 'signal';
};

/**
 * Primary: white on the field, ink on bone. Secondary: a hairline outline.
 * Signal ("this one"): a coral fill with ink text, never coral text.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { tone = 'bone', variant = 'primary', style, className, ...rest },
  ref
) {
  const onField = tone === 'field';
  const look: Record<string, CSSProperties> = {
    primary: onField
      ? { background: '#fff', color: INK, border: '1px solid #fff' }
      : { background: INK, color: BONE, border: `1px solid ${INK}` },
    secondary: onField
      ? { background: FIELD, color: '#fff', border: '1px solid rgba(255,255,255,.9)' }
      : { background: 'transparent', color: INK, border: `1px solid ${INK}` },
    signal: { background: SIGNAL, color: INK, border: `1px solid ${SIGNAL}` },
  };
  return (
    <button
      ref={ref}
      className={`sys-press ${onField ? 'sys-focus-field' : 'sys-focus'} ${className ?? ''}`}
      style={{
        fontFamily: SYSTEM_FONTS.plex,
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '12px 18px',
        borderRadius: 0,
        cursor: rest.disabled ? 'not-allowed' : 'pointer',
        opacity: rest.disabled ? 0.55 : 1,
        transition: PRESS,
        ...look[variant],
        ...style,
      }}
      {...rest}
    />
  );
});

/** A bone field with ink text and a hairline; Plex Mono placeholder. */
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ style, className, invalid, ...rest }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={`sys-input sys-focus ${className ?? ''}`}
      style={{
        width: '100%',
        background: BONE,
        color: INK,
        border: `1px solid ${invalid ? SIGNAL : 'rgba(14,14,14,.28)'}`,
        borderRadius: 0,
        padding: '12px 14px',
        fontFamily: SYSTEM_FONTS.display,
        fontSize: 16,
        ...style,
      }}
      {...rest}
    />
  );
});

/** A tag in Plex Mono with a hairline. On the field it sits on a Klein backing. */
export function Tag({
  tone = 'bone',
  children,
  active,
}: {
  tone?: Tone;
  children: ReactNode;
  active?: boolean;
}) {
  const onField = tone === 'field';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: SYSTEM_FONTS.plex,
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '4px 8px',
        whiteSpace: 'nowrap',
        border: `1px solid ${active ? SIGNAL : onField ? 'rgba(255,255,255,.9)' : 'rgba(14,14,14,.3)'}`,
        background: active ? SIGNAL : onField ? FIELD : 'transparent',
        color: active ? INK : onField ? '#fff' : INK,
      }}
    >
      {children}
    </span>
  );
}

/** A stat: label, then a big number. The one moment that may count up. */
export function Stat({ label, value, unit }: { label: string; value: ReactNode; unit?: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{
          fontFamily: SYSTEM_FONTS.vcr,
          fontSize: 11,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'rgba(14,14,14,.62)',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: SYSTEM_FONTS.display,
          fontWeight: 700,
          fontSize: 44,
          letterSpacing: '-0.04em',
          lineHeight: 1.05,
          marginTop: 6,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              fontFamily: SYSTEM_FONTS.plex,
              fontWeight: 400,
              fontSize: 14,
              letterSpacing: 0,
              marginLeft: 6,
              color: 'rgba(14,14,14,.62)',
            }}
          >
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}
