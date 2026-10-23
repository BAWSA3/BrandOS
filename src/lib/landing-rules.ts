import { indexEnabled } from '@/lib/index-rules';

/** Pure rules for the homepage landing scroll (tested in scripts/test-field.ts). */

export type Phases = { define: number; check: number; generate: number; scale: number };

/** The Index opens to the public on 2 Nov 2026, 00:00 in Los Angeles (PDT = UTC-7). */
export const INDEX_OPENS_AT = Date.parse('2026-11-02T07:00:00Z');

export const indexOpen = (now = Date.now()) => indexEnabled() || now >= INDEX_OPENS_AT;

/** Parses a BrandScans.phase_scores JSON string; null if it isn't the four phases. Pure (tested). */
export function parsePhases(raw: string | null | undefined): Phases | null {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as Record<string, unknown>;
    const n = (k: string) => (typeof p[k] === 'number' ? Math.round(p[k] as number) : NaN);
    const phases = {
      define: n('define'),
      check: n('check'),
      generate: n('generate'),
      scale: n('scale'),
    };
    return Object.values(phases).every((v) => Number.isFinite(v) && v >= 0 && v <= 100)
      ? phases
      : null;
  } catch {
    return null;
  }
}
