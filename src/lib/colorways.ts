// Dashboard colorways (picked in Settings, saved to the account — migration 036).
// Each one is a full set of the dashboard's neutral tokens; Klein blue stays the
// one bright signal (the score tile) in all four.

export type Colorway = 'bone' | 'night' | 'klein' | 'paper';

export const COLORWAYS: { id: Colorway; name: string; hint: string }[] = [
  { id: 'bone', name: 'Bone', hint: 'Warm canvas, the default' },
  { id: 'night', name: 'Night', hint: 'Dark' },
  { id: 'klein', name: 'Klein', hint: 'Klein-blue canvas' },
  { id: 'paper', name: 'Paper', hint: 'Pure white, ink only' },
];

export const DEFAULT_COLORWAY: Colorway = 'bone';

export function isColorway(v: unknown): v is Colorway {
  return typeof v === 'string' && COLORWAYS.some((c) => c.id === v);
}

/** Dark surfaces (the station renders at night, overlays go dark). */
export const isDarkColorway = (c: Colorway) => c === 'night';

export const COLORWAY_TOKENS: Record<Colorway, Record<string, string>> = {
  night: {
    '--d-canvas': '#0B0B0C',
    '--d-tile': '#161618',
    '--d-rule': 'rgba(231,231,228,0.08)',
    '--d-ink': '#E7E7E4',
    '--d-muted': '#8A8A86',
    '--d-dim': '#55554F',
    '--d-bar': '#B9B8AE',
    '--d-track': 'rgba(231,231,228,0.1)',
    '--d-callout': '#C9C8C2',
    '--d-callout-line': 'rgba(231,231,228,0.45)',
    '--d-accent-edge': '#0047FF',
    '--d-head': '#E7E7E4', // type on the canvas (v2 masthead)
    '--d-head-muted': '#8A8A86',
  },
  bone: {
    '--d-canvas': '#F2EFE8', // warm bone
    '--d-tile': '#FAF8F3',
    '--d-rule': 'rgba(14,14,14,0.09)',
    '--d-ink': '#0E0E0E',
    '--d-muted': '#6B6B6B',
    '--d-dim': '#B5B4AE',
    '--d-bar': '#1C1C1C',
    '--d-track': 'rgba(14,14,14,0.08)',
    '--d-callout': '#4A4A47',
    '--d-callout-line': 'rgba(14,14,14,0.4)',
    '--d-accent-edge': '#0047FF',
    '--d-head': '#0E0E0E', // type on the canvas (v2 masthead)
    '--d-head-muted': '#6B6B6B',
  },
  // Klein canvas, bone tiles (the station's own background); the blue score tile keeps a white edge so it
  // still reads as a tile against the blue.
  klein: {
    '--d-canvas': '#0047FF',
    '--d-tile': '#FAF8F3',
    '--d-rule': 'rgba(14,14,14,0.1)',
    '--d-ink': '#0E0E0E',
    '--d-muted': '#5E5E5A',
    '--d-dim': '#B5B4AE',
    '--d-bar': '#1C1C1C',
    '--d-track': 'rgba(14,14,14,0.08)',
    '--d-callout': '#4A4A47',
    '--d-callout-line': 'rgba(14,14,14,0.4)',
    '--d-accent-edge': 'rgba(255,255,255,0.7)',
    '--d-head': '#FFFFFF', // type on the canvas (v2 masthead)
    '--d-head-muted': 'rgba(255,255,255,0.75)',
  },
  // Pure white, hairline rules, ink only.
  paper: {
    '--d-canvas': '#FFFFFF',
    '--d-tile': '#FFFFFF',
    '--d-rule': 'rgba(14,14,14,0.14)',
    '--d-ink': '#0A0A0A',
    '--d-muted': '#6B6B6B',
    '--d-dim': '#BDBDBD',
    '--d-bar': '#0A0A0A',
    '--d-track': 'rgba(14,14,14,0.07)',
    '--d-callout': '#3F3F3F',
    '--d-callout-line': 'rgba(14,14,14,0.4)',
    '--d-accent-edge': '#0047FF',
    '--d-head': '#0A0A0A', // type on the canvas (v2 masthead)
    '--d-head-muted': '#6B6B6B',
  },
};

/** Small swatch for the Settings preview: canvas, tile, accent. */
export const COLORWAY_SWATCH: Record<Colorway, { canvas: string; tile: string; edge: string }> = {
  bone: { canvas: '#F2EFE8', tile: '#FAF8F3', edge: 'rgba(14,14,14,0.12)' },
  night: { canvas: '#0B0B0C', tile: '#161618', edge: 'rgba(231,231,228,0.12)' },
  klein: { canvas: '#0047FF', tile: '#FAF8F3', edge: 'rgba(14,14,14,0.1)' },
  paper: { canvas: '#FFFFFF', tile: '#FFFFFF', edge: 'rgba(14,14,14,0.2)' },
};

// This-device copy: previews (no account) and an instant apply before the save lands.
const LOCAL_KEY = 'brandos:dash-colorway';
export function readLocalColorway(): Colorway | null {
  try {
    const v = window.localStorage.getItem(LOCAL_KEY);
    return isColorway(v) ? v : null;
  } catch {
    return null;
  }
}
export function writeLocalColorway(c: Colorway) {
  try {
    window.localStorage.setItem(LOCAL_KEY, c);
  } catch {
    // storage blocked: the account save still applies
  }
}

/** Save a pick to the account (signed-in pages). Resolves false if it didn't save. */
export async function saveColorwayToAccount(c: Colorway): Promise<boolean> {
  try {
    const r = await fetch('/api/me/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dashboardColorway: c }),
    });
    return r.ok;
  } catch {
    return false;
  }
}

/**
 * The public /@handle page in the creator's skin. `head*` is type on the page
 * canvas (header, handle); panels carry their own ink.
 */
export const PUBLIC_TOKENS: Record<Colorway, Record<string, string>> = {
  bone: {
    '--p-bg': '#F2EFE8',
    '--p-panel': '#FFFFFF',
    '--p-ink': '#0E0E0E',
    '--p-muted': '#6B6862',
    '--p-rule': 'rgba(14,14,14,0.12)',
    '--p-track': 'rgba(14,14,14,0.08)',
    '--p-head': '#0E0E0E',
    '--p-head-muted': '#6B6862',
    '--p-cta-edge': '#0047FF',
  },
  night: {
    '--p-bg': '#0B0B0C',
    '--p-panel': '#161618',
    '--p-ink': '#E7E7E4',
    '--p-muted': '#8A8A86',
    '--p-rule': 'rgba(231,231,228,0.1)',
    '--p-track': 'rgba(231,231,228,0.1)',
    '--p-head': '#E7E7E4',
    '--p-head-muted': '#8A8A86',
    '--p-cta-edge': '#0047FF',
  },
  klein: {
    '--p-bg': '#0047FF',
    '--p-panel': '#FAF8F3',
    '--p-ink': '#0E0E0E',
    '--p-muted': '#5E5E5A',
    '--p-rule': 'rgba(14,14,14,0.1)',
    '--p-track': 'rgba(14,14,14,0.08)',
    '--p-head': '#FFFFFF',
    '--p-head-muted': 'rgba(255,255,255,0.75)',
    '--p-cta-edge': 'rgba(255,255,255,0.7)',
  },
  paper: {
    '--p-bg': '#FFFFFF',
    '--p-panel': '#FFFFFF',
    '--p-ink': '#0A0A0A',
    '--p-muted': '#6B6B6B',
    '--p-rule': 'rgba(14,14,14,0.16)',
    '--p-track': 'rgba(14,14,14,0.07)',
    '--p-head': '#0A0A0A',
    '--p-head-muted': '#6B6B6B',
    '--p-cta-edge': '#0047FF',
  },
};

/** Which wordmark art sits on this skin's canvas. */
export const wordmarkFor = (c: Colorway): 'day' | 'night' | 'white' =>
  c === 'klein' ? 'white' : c === 'night' ? 'night' : 'day';
