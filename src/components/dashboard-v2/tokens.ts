import type { Colorway } from '@/lib/colorways';

/**
 * Dashboard v2 tokens (/dashboard behind DASHBOARD_V2, and the mockups), one full set per finish.
 * Everything in the mockup reads `var(--v-*)`, so a finish switch is one
 * attribute change and no component knows which finish it is in.
 *
 * Contrast (AA, 4.5:1 for body text) checked per finish:
 * - `--v-signal-text` is Klein on light grounds and a lighter Klein (#7C9DFF)
 *   on Night, where #0047FF on #161618 is only ~2.9:1.
 * - On the Klein canvas, muted type is white at 85% (~4.9:1), not 75% (~4.0:1).
 * - `--v-signal` is always the fill (#0047FF) with white type on it (~6.3:1).
 */
export const V_TOKENS: Record<Colorway, Record<string, string>> = {
  bone: {
    '--v-cta': '#0047FF',
    '--v-cta-ink': '#FFFFFF',
    '--v-canvas': '#F2EFE8',
    '--v-surface': '#FAF8F3',
    '--v-raised': '#FFFFFF',
    '--v-ink': '#0E0E0E',
    '--v-muted': '#67645E',
    '--v-rule': 'rgba(14,14,14,0.10)',
    '--v-track': 'rgba(14,14,14,0.08)',
    '--v-dot': 'rgba(14,14,14,0.13)',
    '--v-head': '#0E0E0E',
    '--v-head-muted': '#67645E',
    '--v-signal': '#0047FF',
    '--v-signal-text': '#0047FF',
    '--v-on-signal': '#FFFFFF',
    '--v-signal-edge': 'transparent',
    '--v-soft': 'rgba(0,71,255,0.07)',
    '--v-focus': '#0047FF',
    '--v-scrim': 'rgba(14,14,14,0.28)',
    '--v-shadow': '0 1px 0 rgba(14,14,14,0.04), 0 12px 32px -18px rgba(14,14,14,0.25)',
  },
  night: {
    '--v-cta': '#0047FF',
    '--v-cta-ink': '#FFFFFF',
    '--v-canvas': '#0B0B0C',
    '--v-surface': '#161618',
    '--v-raised': '#1D1D20',
    '--v-ink': '#E7E7E4',
    '--v-muted': '#9A9A95',
    '--v-rule': 'rgba(231,231,228,0.10)',
    '--v-track': 'rgba(231,231,228,0.10)',
    '--v-dot': 'rgba(231,231,228,0.10)',
    '--v-head': '#E7E7E4',
    '--v-head-muted': '#9A9A95',
    '--v-signal': '#0047FF',
    '--v-signal-text': '#7C9DFF',
    '--v-on-signal': '#FFFFFF',
    '--v-signal-edge': 'transparent',
    '--v-soft': 'rgba(124,157,255,0.10)',
    '--v-focus': '#7C9DFF',
    '--v-scrim': 'rgba(0,0,0,0.55)',
    '--v-shadow': '0 1px 0 rgba(0,0,0,0.3), 0 16px 40px -20px rgba(0,0,0,0.8)',
  },
  klein: {
    // on the Klein canvas the one action turns white, or it melts into the ground
    '--v-cta': '#FFFFFF',
    '--v-cta-ink': '#0047FF',
    '--v-canvas': '#0047FF',
    '--v-surface': '#FAF8F3',
    '--v-raised': '#FFFFFF',
    '--v-ink': '#0E0E0E',
    '--v-muted': '#5E5E5A',
    '--v-rule': 'rgba(14,14,14,0.10)',
    '--v-track': 'rgba(14,14,14,0.08)',
    '--v-dot': 'rgba(255,255,255,0.22)',
    '--v-head': '#FFFFFF',
    '--v-head-muted': 'rgba(255,255,255,0.85)',
    '--v-signal': '#0047FF',
    '--v-signal-text': '#0047FF',
    '--v-on-signal': '#FFFFFF',
    '--v-signal-edge': 'rgba(255,255,255,0.9)',
    '--v-soft': 'rgba(0,71,255,0.07)',
    '--v-focus': '#FFFFFF',
    '--v-scrim': 'rgba(0,20,90,0.45)',
    '--v-shadow': '0 1px 0 rgba(0,0,0,0.06), 0 18px 40px -20px rgba(0,10,60,0.6)',
  },
  paper: {
    '--v-cta': '#0047FF',
    '--v-cta-ink': '#FFFFFF',
    '--v-canvas': '#FFFFFF',
    '--v-surface': '#FFFFFF',
    '--v-raised': '#FFFFFF',
    '--v-ink': '#0A0A0A',
    '--v-muted': '#666666',
    '--v-rule': 'rgba(14,14,14,0.16)',
    '--v-track': 'rgba(14,14,14,0.07)',
    '--v-dot': 'rgba(14,14,14,0.14)',
    '--v-head': '#0A0A0A',
    '--v-head-muted': '#666666',
    '--v-signal': '#0047FF',
    '--v-signal-text': '#0047FF',
    '--v-on-signal': '#FFFFFF',
    '--v-signal-edge': 'transparent',
    '--v-soft': 'rgba(0,71,255,0.06)',
    '--v-focus': '#0047FF',
    '--v-scrim': 'rgba(10,10,10,0.25)',
    '--v-shadow': '0 0 0 1px rgba(14,14,14,0.08), 0 12px 28px -18px rgba(14,14,14,0.3)',
  },
};

/** Coral: "this one" only (one cell per screen, Direction 02). A fill, never text. */
export const CORAL = '#FF4B2B';
export const KLEIN = '#0047FF';
