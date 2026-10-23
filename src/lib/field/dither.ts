/**
 * The field (docs/BRAND-WORLD.md, Direction 02): the world rendered as a 1-bit
 * dither, white square dots on Klein, with a white grid over it and at most one
 * coral "signal" cell. Pure and framework-free so the browser (DitherField) and
 * the server (share images, src/lib/og/dither.ts) draw exactly the same field.
 *
 * Ported from the BrandOS World prototype: 8x8 Bayer threshold, dot ≈ 0.62 × cell,
 * seeded fBm clouds with domain warp, luma from any pixel buffer.
 */

export const FIELD = '#0047FF';
export const SIGNAL = '#FF4B2B';
export const DOT = '#FFFFFF';
export const GRID = 'rgba(255,255,255,0.9)';

/** Brightness at (u, v) in [0,1]², returning 0 (Klein) … 1 (white). */
export type Luma = (u: number, v: number) => number;

/** The 8x8 Bayer matrix (values 0–63), built by recursion so it's exact. */
export const BAYER8: number[][] = (() => {
  let m = [[0]];
  for (let s = 1; s < 8; s *= 2) {
    const n: number[][] = [];
    for (let y = 0; y < s * 2; y++) {
      n[y] = [];
      for (let x = 0; x < s * 2; x++) {
        const q = [0, 2, 3, 1][(y < s ? 0 : 2) + (x < s ? 0 : 1)];
        n[y][x] = 4 * m[y % s][x % s] + q;
      }
    }
    m = n;
  }
  return m;
})();

/** Threshold for a cell: a dot is drawn when luma > threshold(x, y). */
export const threshold = (x: number, y: number) => (BAYER8[y & 7][x & 7] + 0.5) / 64;

export const dotSize = (cell: number) => Math.max(1.6, cell * 0.62);

function seeded(seed: number) {
  let s = Math.max(1, Math.floor(seed) % 2147483647);
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Seeded fractal value noise (5 octaves), deterministic for a given seed. */
export function makeNoise(seed: number): (x: number, y: number) => number {
  const r = seeded(seed);
  const perm = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [perm[i], perm[j]] = [perm[j], perm[i]];
  }
  const vals = perm.map(() => r());
  const h = (x: number, y: number) => vals[perm[(perm[x & 255] + y) & 255]];
  const sm = (t: number) => t * t * (3 - 2 * t);
  const n2 = (x: number, y: number) => {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const u = sm(x - xi);
    const v = sm(y - yi);
    const a = h(xi, yi);
    const b = h(xi + 1, yi);
    const c = h(xi, yi + 1);
    const d = h(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  return (x, y) => {
    let s = 0;
    let amp = 0.5;
    let f = 1;
    for (let o = 0; o < 5; o++) {
      s += amp * n2(x * f, y * f);
      f *= 2;
      amp *= 0.5;
    }
    return s;
  };
}

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};

/** Dithered clouds: brighter towards the top, density 0.3 (heavy) … 0.6 (sparse). */
export function clouds(seed = 11, density = 0.42): Luma {
  const f = makeNoise(seed);
  const warp = makeNoise(seed + 7);
  return (u, v) => {
    const wx = warp(u * 2, v * 2) * 1.2;
    const wy = warp(u * 2 + 5, v * 2 + 3) * 1.2;
    const n = f(u * 3.2 + wx, v * 2.2 + wy);
    return Math.min(
      1,
      smooth(density, density + 0.32, n) * (0.55 + 0.45 * (1 - v)) + 0.06 * (1 - v)
    );
  };
}

/**
 * Luma from a pixel buffer (RGBA by default), e.g. a photo drawn into a canvas or
 * decoded on the server. `contrast` > 1 pushes mid-tones apart so faces read.
 */
export function fromPixels(
  data: ArrayLike<number>,
  width: number,
  height: number,
  contrast = 1.2,
  channels = 4
): Luma {
  return (u, v) => {
    const x = Math.min(width - 1, Math.floor(u * width));
    const y = Math.min(height - 1, Math.floor(v * height));
    const i = (y * width + x) * channels;
    const l = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
    return Math.max(0, Math.min(1, (l - 0.5) * contrast + 0.5));
  };
}

/** The minimal drawing surface the field needs: a 2D canvas context satisfies it. */
export interface Surface {
  fillStyle: unknown;
  fillRect(x: number, y: number, w: number, h: number): void;
}

export type FieldOptions = {
  width: number;
  height: number;
  /** Dot pitch in px (default 5). */
  cell?: number;
  /** Grid pitch in px; 0 or undefined = no grid. */
  grid?: number;
  /** The one coral cell, in grid units [column, row]. Needs `grid`. */
  signalCell?: [number, number];
};

/** Calls `dot` for every lit cell. Exposed for tests and custom renderers. */
export function forEachDot(
  luma: Luma,
  width: number,
  height: number,
  cell: number,
  dot: (x: number, y: number, size: number) => void
) {
  const size = dotSize(cell);
  const cols = Math.ceil(width / cell);
  const rows = Math.ceil(height / cell);
  const pad = (cell - size) / 2;
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++)
      if (luma((x + 0.5) / cols, (y + 0.5) / rows) > threshold(x, y))
        dot(x * cell + pad, y * cell + pad, size);
}

/** Paints the whole field: Klein ground, the signal cell, the dots, then the grid. */
export function paintField(g: Surface, luma: Luma, o: FieldOptions) {
  const { width: w, height: h } = o;
  const cell = o.cell ?? 5;
  g.fillStyle = FIELD;
  g.fillRect(0, 0, w, h);
  if (o.grid && o.signalCell) {
    g.fillStyle = SIGNAL;
    g.fillRect(o.signalCell[0] * o.grid, o.signalCell[1] * o.grid, o.grid, o.grid);
  }
  g.fillStyle = DOT;
  forEachDot(luma, w, h, cell, (x, y, s) => g.fillRect(x, y, s, s));
  if (o.grid) {
    g.fillStyle = GRID;
    for (let gx = o.grid; gx < w; gx += o.grid) g.fillRect(Math.round(gx), 0, 1, h);
    for (let gy = o.grid; gy < h; gy += o.grid) g.fillRect(0, Math.round(gy), w, 1);
  }
}
