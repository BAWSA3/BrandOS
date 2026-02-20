/* ────────────────────────────────────────────────────────────
   ASCII Sky Engine — Pure TypeScript scene computation
   Windows XP "Bliss"-inspired procedural sky, clouds & hills.
   No React, no DOM — just math → AsciiCell[][].
   ──────────────────────────────────────────────────────────── */

export interface Cloud {
  x: number;       // center column (float, wraps)
  y: number;       // center row
  rx: number;      // horizontal radius (columns)
  ry: number;      // vertical radius (rows)
  speed: number;   // cols per second
  density: number; // 0-1, thicker clouds are more opaque
}

export interface AsciiCell {
  char: string;
  color: string;
}

export interface SceneConfig {
  cols: number;
  rows: number;
  clouds: Cloud[];
  showHills: boolean;
  skyColorTop: string;
  skyColorBottom: string;
  cloudColor: string;
  hillColor: string;
  hillColorFar: string;
  time: number; // seconds elapsed, for subtle shimmer
}

// ── Character palettes ──

const SKY_CHARS = [' ', ' ', ' ', '·', '.', '°', ' ', ' '];
const CLOUD_CHARS_BY_DENSITY: string[] = ['░', '░', '▒', '▓', '█'];
const HILL_CHARS = ['^', '"', "'", ',', '.', '·'];

// ── Deterministic pseudo-random (seeded by position) ──

function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263 + 1013904223) | 0;
  h = ((h >> 13) ^ h) | 0;
  h = (h * 1274126177 + 1013904223) | 0;
  return ((h >> 16) & 0x7fff) / 0x7fff; // 0..1
}

// ── Cloud generation ──

export function generateInitialClouds(
  cols: number,
  rows: number,
  count: number,
): Cloud[] {
  const clouds: Cloud[] = [];
  const skyRows = Math.floor(rows * 0.6); // clouds only in top 60%
  for (let i = 0; i < count; i++) {
    const seed = hash(i * 7 + 3, i * 13 + 7);
    const seed2 = hash(i * 11 + 5, i * 17 + 2);
    const seed3 = hash(i * 19 + 1, i * 23 + 9);
    clouds.push({
      x: seed * cols,
      y: 2 + seed2 * (skyRows - 4),
      rx: 6 + seed3 * 14,                  // 6-20 cols wide
      ry: 1.5 + hash(i, 99) * 2.5,        // 1.5-4 rows tall
      speed: 1.5 + hash(i, 42) * 3,       // 1.5-4.5 cols/sec
      density: 0.4 + hash(i, 77) * 0.5,   // 0.4-0.9
    });
  }
  return clouds;
}

// ── Cloud drift ──

export function advanceClouds(clouds: Cloud[], dt: number, cols: number): Cloud[] {
  return clouds.map((c) => {
    let nx = c.x + c.speed * dt;
    // Wrap with buffer so cloud slides fully off before reappearing
    if (nx - c.rx > cols) nx = -c.rx;
    return { ...c, x: nx };
  });
}

// ── Hill profile (sum of sines) ──

export function hillHeight(col: number, cols: number): number {
  const t = col / cols;
  const h1 = Math.sin(t * Math.PI * 2.0) * 0.35;
  const h2 = Math.sin(t * Math.PI * 4.5 + 1.2) * 0.2;
  const h3 = Math.sin(t * Math.PI * 7.0 + 2.8) * 0.1;
  const h4 = Math.sin(t * Math.PI * 1.3 + 0.5) * 0.15;
  return 0.3 + h1 + h2 + h3 + h4; // normalized 0..~1
}

// ── Hex color interpolation ──

function parseColor(color: string): [number, number, number] {
  // Handle rgb()/rgba() strings
  const rgbMatch = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1]), parseInt(rgbMatch[2]), parseInt(rgbMatch[3])];
  }
  // Handle hex
  const h = color.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16) || 0,
    parseInt(h.substring(2, 4), 16) || 0,
    parseInt(h.substring(4, 6), 16) || 0,
  ];
}

function lerpColor(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseColor(a);
  const [br, bg, bb] = parseColor(b);
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return `rgb(${r},${g},${bl})`;
}

function rgbWithAlpha(hex: string, alpha: number): string {
  const [r, g, b] = parseColor(hex);
  return `rgba(${r},${g},${b},${alpha.toFixed(2)})`;
}

// ── Cloud ellipse test ──

function cloudDensityAt(col: number, row: number, clouds: Cloud[], cols: number): { density: number; closest: Cloud | null } {
  let maxDensity = 0;
  let closest: Cloud | null = null;

  for (const c of clouds) {
    // Handle wrapping — check the cloud and its wrap-around ghost
    for (const offset of [0, cols]) {
      const cx = c.x + offset;
      const dx = (col - cx) / c.rx;
      const dy = (row - c.y) / c.ry;
      const dist = dx * dx + dy * dy;
      if (dist < 1) {
        // Soft falloff from center
        const d = (1 - dist) * c.density;
        if (d > maxDensity) {
          maxDensity = d;
          closest = c;
        }
      }
    }
    // Also check negative wrap
    {
      const cx = c.x - cols;
      const dx = (col - cx) / c.rx;
      const dy = (row - c.y) / c.ry;
      const dist = dx * dx + dy * dy;
      if (dist < 1) {
        const d = (1 - dist) * c.density;
        if (d > maxDensity) {
          maxDensity = d;
          closest = c;
        }
      }
    }
  }

  return { density: maxDensity, closest };
}

// ── Main scene computation ──

export function computeScene(config: SceneConfig): AsciiCell[][] {
  const { cols, rows, clouds, showHills, skyColorTop, skyColorBottom, cloudColor, hillColor, hillColorFar, time } = config;

  const grid: AsciiCell[][] = [];

  // Precompute hill heights
  const hillHeights: number[] = [];
  if (showHills) {
    for (let c = 0; c < cols; c++) {
      // hills occupy bottom ~30% of rows
      const hNorm = hillHeight(c, cols);
      const hillRows = Math.floor(rows * 0.30);
      hillHeights[c] = rows - Math.floor(hNorm * hillRows);
    }
  }

  for (let r = 0; r < rows; r++) {
    const row: AsciiCell[] = [];
    for (let c = 0; c < cols; c++) {
      const rowFrac = r / (rows - 1); // 0 = top, 1 = bottom

      // ── Layer 1: Sky gradient ──
      const skyColor = lerpColor(skyColorTop, skyColorBottom, rowFrac);
      const skyCharIdx = Math.floor(hash(c, r) * SKY_CHARS.length);
      let char = SKY_CHARS[skyCharIdx];
      let color = skyColor;

      // Subtle star-like sparkle in top rows
      if (r < rows * 0.15 && hash(c + Math.floor(time * 0.3), r) > 0.97) {
        char = '·';
      }

      // ── Layer 2: Clouds ──
      const { density: cDensity } = cloudDensityAt(c, r, clouds, cols);
      if (cDensity > 0.05) {
        const charIdx = Math.min(
          CLOUD_CHARS_BY_DENSITY.length - 1,
          Math.floor(cDensity * CLOUD_CHARS_BY_DENSITY.length),
        );
        char = CLOUD_CHARS_BY_DENSITY[charIdx];
        // Blend cloud color with sky based on density
        color = rgbWithAlpha(cloudColor, 0.4 + cDensity * 0.6);
      }

      // ── Layer 3: Hills ──
      if (showHills && hillHeights[c] !== undefined && r >= hillHeights[c]) {
        const depth = (r - hillHeights[c]) / (rows - hillHeights[c]); // 0 = ridge, 1 = bottom
        const hillCharIdx = Math.min(
          HILL_CHARS.length - 1,
          Math.floor(hash(c, r + 500) * HILL_CHARS.length),
        );

        // At the ridge line use sharper chars
        if (r === hillHeights[c]) {
          char = depth < 0.3 ? '^' : HILL_CHARS[hillCharIdx];
        } else {
          char = HILL_CHARS[hillCharIdx];
        }

        color = lerpColor(hillColorFar, hillColor, 1 - depth * 0.6);
      }

      row.push({ char, color });
    }
    grid.push(row);
  }

  return grid;
}

// ── Serialise grid to color-batched HTML ──
// Groups consecutive cells with the same color into a single <span>.

export function gridToHtml(grid: AsciiCell[][]): string {
  const parts: string[] = [];

  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    let runColor = row[0]?.color ?? '';
    let runChars = '';

    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (cell.color === runColor) {
        runChars += cell.char;
      } else {
        // Flush previous run
        parts.push(`<span style="color:${runColor}">${escapeHtml(runChars)}</span>`);
        runColor = cell.color;
        runChars = cell.char;
      }
    }
    // Flush last run in the row
    if (runChars) {
      parts.push(`<span style="color:${runColor}">${escapeHtml(runChars)}</span>`);
    }
    if (r < grid.length - 1) parts.push('\n');
  }

  return parts.join('');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
