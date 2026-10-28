import type { Colorway } from '@/lib/colorways';

/**
 * The growth section in each finish (dashboard v2). `T` in ./parts.tsx reads
 * these with Bone fallbacks, so without them the page looks exactly as before.
 *
 * AA notes: Klein as text on Night is #7C9DFF (#0047FF on #161618 is ~2.9:1);
 * the idea board's X surfaces use X's own dark palette on Night.
 */
export const GROWTH_TOKENS: Record<Colorway, Record<string, string>> = {
  bone: {
    '--g-canvas': '#F2EFE8',
    '--g-head': '#0E0E0E',
    '--g-head-muted': '#67645E',
    '--g-tile': '#FAF8F3',
    '--g-raised': '#FFFFFF',
    '--g-ink': '#0E0E0E',
    '--g-muted': '#67645E',
    '--g-rule': 'rgba(14,14,14,0.10)',
    '--g-track': 'rgba(14,14,14,0.08)',
    '--g-blue-text': '#0047FF',
    '--g-blue-edge': 'transparent',
  },
  night: {
    '--g-canvas': '#0B0B0C',
    '--g-head': '#E7E7E4',
    '--g-head-muted': '#9A9A95',
    '--g-tile': '#161618',
    '--g-raised': '#1D1D20',
    '--g-ink': '#E7E7E4',
    '--g-muted': '#9A9A95',
    '--g-rule': 'rgba(231,231,228,0.10)',
    '--g-track': 'rgba(231,231,228,0.10)',
    '--g-blue-text': '#7C9DFF',
    '--g-blue-edge': 'transparent',
    '--x-surface': '#16181C',
    '--x-ink': '#E7E9EA',
    '--x-muted': '#8B98A5',
    '--x-rule': '#2F3336',
  },
  // Klein canvas with bone tiles; the Klein score tile keeps a white edge
  klein: {
    '--g-canvas': '#0047FF',
    '--g-head': '#FFFFFF',
    '--g-head-muted': 'rgba(255,255,255,0.85)',
    '--g-tile': '#FAF8F3',
    '--g-raised': '#FFFFFF',
    '--g-ink': '#0E0E0E',
    '--g-muted': '#5E5E5A',
    '--g-rule': 'rgba(14,14,14,0.10)',
    '--g-track': 'rgba(14,14,14,0.08)',
    '--g-blue-text': '#0047FF',
    '--g-blue-edge': 'rgba(255,255,255,0.9)',
  },
  paper: {
    '--g-canvas': '#FFFFFF',
    '--g-head': '#0A0A0A',
    '--g-head-muted': '#666666',
    '--g-tile': '#FFFFFF',
    '--g-raised': '#FFFFFF',
    '--g-ink': '#0A0A0A',
    '--g-muted': '#666666',
    '--g-rule': 'rgba(14,14,14,0.16)',
    '--g-track': 'rgba(14,14,14,0.07)',
    '--g-blue-text': '#0047FF',
    '--g-blue-edge': 'transparent',
  },
};
