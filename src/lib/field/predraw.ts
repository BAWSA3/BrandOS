/**
 * The field, pre-drawn: a tiny inline script that paints the field into the
 * server-rendered canvas while the HTML is still parsing, so a field page shows
 * the field on first paint instead of flat Klein until the JS bundle hydrates.
 * FieldBackground then adopts that canvas instead of drawing again.
 *
 * The script is kept here as plain JavaScript text (not Function#toString of
 * compiled code, which bundlers decorate with helpers). PAINT_JS is a hand port
 * of paintField(clouds(seed, density)) with fieldMetrics + signalCellFor
 * (src/lib/field/dither.ts, system.ts); test:field runs it against the real
 * thing for several viewports and asserts the exact same drawing.
 */

export type PredrawSignal = 'none' | 'auto' | [number, number];

export type PredrawConfig = {
  /** The canvas's element id. */
  id: string;
  seed: number;
  density: number;
  signal: PredrawSignal;
  /**
   * Static pages that can't know the switch on the server (the homepage reads
   * `?field=1` in the browser): run fieldSwitch here, and do nothing when off.
   */
  gate?: { env: boolean; appEnv: string };
};

/** Identifies one drawing: viewport, pixel ratio and the field's settings. Same format as BOOT_JS. */
export function predrawKey(
  w: number,
  h: number,
  dpr: number,
  seed: number,
  density: number,
  signal: PredrawSignal
): string {
  return `${w}x${h}@${dpr}|${seed}|${density}|${String(signal)}`;
}

/** function (g, w, h, seed, density, signal): paints the field's first frame. */
export const PAINT_JS = `function (g, w, h, seed, density, signal) {
  var W = Math.max(1, w), H = Math.max(1, h);
  var cell = Math.max(4, Math.min(8, Math.round(W / 275)));
  var cols = W >= 1100 ? 7 : W >= 700 ? 5 : 4;
  var grid = W / cols, gridRows = Math.ceil(H / grid);
  var m = [[0]], s, x, y, i;
  for (s = 1; s < 8; s *= 2) {
    var n = [];
    for (y = 0; y < s * 2; y++) {
      n[y] = [];
      for (x = 0; x < s * 2; x++)
        n[y][x] = 4 * m[y % s][x % s] + [0, 2, 3, 1][(y < s ? 0 : 2) + (x < s ? 0 : 1)];
    }
    m = n;
  }
  function noise(sd) {
    var st = Math.max(1, Math.floor(sd) % 2147483647), perm = [], vals = [], k, j, t;
    function r() { st = (st * 16807) % 2147483647; return (st - 1) / 2147483646; }
    for (k = 0; k < 256; k++) perm.push(k);
    for (k = 255; k > 0; k--) { j = Math.floor(r() * (k + 1)); t = perm[k]; perm[k] = perm[j]; perm[j] = t; }
    for (k = 0; k < 256; k++) vals.push(r());
    function hh(a, b) { return vals[perm[(perm[a & 255] + b) & 255]]; }
    function sm(a) { return a * a * (3 - 2 * a); }
    function n2(px, py) {
      var xi = Math.floor(px), yi = Math.floor(py), u = sm(px - xi), v = sm(py - yi);
      var a = hh(xi, yi), b = hh(xi + 1, yi), c = hh(xi, yi + 1), d = hh(xi + 1, yi + 1);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
    }
    return function (px, py) {
      var sum = 0, amp = 0.5, f = 1, o;
      for (o = 0; o < 5; o++) { sum += amp * n2(px * f, py * f); f *= 2; amp *= 0.5; }
      return sum;
    };
  }
  var fn = noise(seed), warp = noise(seed + 7);
  function luma(u, v) {
    var wx = warp(u * 2, v * 2) * 1.2;
    var wy = warp(u * 2 + 5, v * 2 + 3) * 1.2;
    var nn = fn(u * 3.2 + wx, v * 2.2 + wy);
    var tt = Math.max(0, Math.min(1, (nn - density) / (density + 0.32 - density)));
    return Math.min(1, tt * tt * (3 - 2 * tt) * (0.55 + 0.45 * (1 - v)) + 0.06 * (1 - v));
  }
  g.fillStyle = '#0047FF';
  g.fillRect(0, 0, w, h);
  if (signal !== 'none') {
    var sc = signal === 'auto' ? [cols - 2, 1] : signal;
    g.fillStyle = '#FF4B2B';
    g.fillRect(Math.max(0, Math.min(cols - 1, sc[0])) * grid,
      Math.max(0, Math.min(gridRows - 1, sc[1])) * grid, grid, grid);
  }
  g.fillStyle = '#FFFFFF';
  var size = Math.max(1.6, cell * 0.62), dc = Math.ceil(w / cell), dr = Math.ceil(h / cell);
  var pad = (cell - size) / 2;
  for (y = 0; y < dr; y++)
    for (x = 0; x < dc; x++)
      if (luma((x + 0.5) / dc, (y + 0.5) / dr) > (m[y & 7][x & 7] + 0.5) / 64)
        g.fillRect(x * cell + pad, y * cell + pad, size, size);
  g.fillStyle = 'rgba(255,255,255,0.9)';
  for (i = grid; i < w; i += grid) g.fillRect(Math.round(i), 0, 1, h);
  for (i = grid; i < h; i += grid) g.fillRect(0, Math.round(i), w, 1);
}`;

/** function (c, paint): runs as the HTML parses; sizes the canvas, paints, marks it. */
export const BOOT_JS = `function (c, paint) {
  try {
    if (c.gate) {
      var p = new URLSearchParams(location.search).get('field');
      if (p === '0') return;
      if (!c.gate.env && !(p === '1' && c.gate.appEnv !== 'production')) return;
    }
    var cv = document.getElementById(c.id);
    var g = cv && cv.getContext && cv.getContext('2d');
    if (!g) return;
    var w = window.innerWidth, h = window.innerHeight;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    paint(g, w, h, c.seed, c.density, c.signal);
    var key = w + 'x' + h + '@' + dpr + '|' + c.seed + '|' + c.density + '|' + String(c.signal);
    cv.setAttribute('data-field-key', key);
    cv.style.visibility = 'visible';
    if (c.gate && cv.parentNode) cv.parentNode.style.display = 'block';
    window.__fieldPredraw = { canvas: cv, key: key, ms: Math.round(performance.now()) };
  } catch (e) {}
}`;

const compact = (js: string) =>
  js
    .split('\n')
    .map((l) => l.trim())
    .join('');

const PAINT_MIN = compact(PAINT_JS);
const BOOT_MIN = compact(BOOT_JS);

/** The inline script for one canvas. */
export function predrawScript(c: PredrawConfig): string {
  const cfg = JSON.stringify(c).replace(/</g, '\\u003c');
  return `(${BOOT_MIN})(${cfg},${PAINT_MIN})`;
}
