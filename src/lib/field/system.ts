/**
 * The system (docs/BRAND-WORLD.md, Direction 03): the field from the
 * "Reputation on the record." loop is the background of every screen. Pure
 * sizing and timing rules shared by FieldBackground, DitherWipe and the tests.
 */
import { threshold } from './dither';

/** Bone panels (long reading sits on these, placed on the field). */
export const BONE = '#F2EFE8';
export const INK = '#0E0E0E';
export const HAIRLINE = 'rgba(14,14,14,0.16)';

/** The loop video: 7px dots and 7 grid columns at 1920 wide, clouds at density 0.40. */
export const FIELD_DENSITY = 0.4;

export type Metrics = { cell: number; grid: number; cols: number; rows: number };

/**
 * Dot pitch and grid for a viewport. Dots scale with width (7px at 1920, never
 * under 4px); the grid keeps square cells: 7 columns on desktop, 5 on tablets,
 * 4 on phones, so a cell never gets too small to read as a cell.
 */
export function fieldMetrics(width: number, height: number): Metrics {
  const w = Math.max(1, width);
  const h = Math.max(1, height);
  const cell = Math.max(4, Math.min(8, Math.round(w / 275)));
  const cols = w >= 1100 ? 7 : w >= 700 ? 5 : 4;
  const grid = w / cols;
  return { cell, grid, cols, rows: Math.ceil(h / grid) };
}

/**
 * Where the one coral cell sits: 'none', an explicit [column, row], or 'auto'
 * (second column from the right, second row: clear of left-aligned headlines).
 * Clamped to the visible grid.
 */
export function signalCellFor(
  spec: 'none' | 'auto' | [number, number],
  m: Metrics
): [number, number] | undefined {
  if (spec === 'none') return undefined;
  const [c, r] = spec === 'auto' ? [m.cols - 2, 1] : spec;
  return [Math.max(0, Math.min(m.cols - 1, c)), Math.max(0, Math.min(m.rows - 1, r))];
}

/**
 * The hero drift: the sky moves on a circle in noise space, so it returns to the
 * start every `period` seconds (same trick as the loop video, no seam).
 */
export function driftOffset(seconds: number, period = 60, radius = 0.55): [number, number] {
  const a = ((seconds % period) / period) * Math.PI * 2;
  return [Math.cos(a) * radius - radius, Math.sin(a) * radius];
}

/**
 * Dither wipe: is cell (x, y) covered at `progress` (0 → 1)? A sweep from left to
 * right whose edge is broken up by the Bayer threshold, so the screen changes the
 * way the field is drawn: dot by dot, never as a fade.
 */
export function wipeCovered(x: number, y: number, cols: number, progress: number): boolean {
  if (progress <= 0) return false;
  if (progress >= 1) return true;
  const edge = (x + 0.5) / Math.max(1, cols);
  return edge * 0.72 + threshold(x, y) * 0.28 < progress;
}
