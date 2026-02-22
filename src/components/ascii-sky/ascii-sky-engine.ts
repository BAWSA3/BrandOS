/* ────────────────────────────────────────────────────────────
   ASCII Sky Engine — Pure TypeScript scene computation
   16-bit nature world with seasonal landscapes, winding paths,
   and interactive ground elements.
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
  elementId?: string;  // interactive element identifier
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface GroundElement {
  col: number;
  type: 'sapling' | 'flower' | 'tree' | 'bush' | 'rock' | 'mushroom' | 'sign' | 'fruit-tree' | 'wheat' | 'lantern' | 'snowtree' | 'crystal' | 'star-flower';
  id?: string;
  growth: number; // 0-1, how grown the element is
}

export interface PathConfig {
  enabled: boolean;
  yOffset?: number;      // vertical offset (0 = default, uses bottom ~20%)
  amplitude?: number;    // how wavy the path is (0-1)
  color?: string;
  borderColor?: string;
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
  time: number;
  season?: Season;
  path?: PathConfig;
  groundElements?: GroundElement[];
  timeOfDay?: number; // 0-1: 0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk
}

// ── Seasonal palettes ──

export const SEASON_PALETTES = {
  spring: {
    skyTop: '#2D1B4E',     // pre-dawn purple
    skyBottom: '#E8A0BF',  // soft pink
    hillColor: '#7CB87C',
    hillColorFar: '#4A7A4A',
    cloudColor: '#FFD4E8',
    pathColor: '#C4A882',
    pathBorder: '#8B7355',
    groundAccent: '#E8A838',
  },
  summer: {
    skyTop: '#1565C0',
    skyBottom: '#87CEEB',
    hillColor: '#4a9e3f',
    hillColorFar: '#2d6b28',
    cloudColor: '#ffffff',
    pathColor: '#D4A76A',
    pathBorder: '#A0845C',
    groundAccent: '#FFD700',
  },
  autumn: {
    skyTop: '#4A1A2E',
    skyBottom: '#D4781E',
    hillColor: '#B87333',
    hillColorFar: '#8B5E3C',
    cloudColor: '#FFB366',
    pathColor: '#A0845C',
    pathBorder: '#6B5B3E',
    groundAccent: '#9D4EDD',
  },
  winter: {
    skyTop: '#050510',
    skyBottom: '#0D1B2A',
    hillColor: '#2A3A4A',
    hillColorFar: '#1A2535',
    cloudColor: '#4A5568',
    pathColor: '#6B7B8D',
    pathBorder: '#4A5568',
    groundAccent: '#00D4FF',
  },
} as const;

// ── Character palettes ──

const SKY_CHARS = [' ', ' ', ' ', '·', '.', '°', ' ', ' '];
const CLOUD_CHARS_BY_DENSITY: string[] = ['░', '░', '▒', '▓', '█'];
const HILL_CHARS = ['^', '"', "'", ',', '.', '·'];
const PATH_CHARS = ['.', ':', '·', '.', '·'];
const PATH_BORDER_CHARS = ['═', '─', '═', '─'];

const ELEMENT_SHAPES: Record<string, { chars: string[][]; colors?: string[] }> = {
  sapling: {
    chars: [
      ['⌃'],
      ['|'],
    ],
  },
  flower: {
    chars: [['✿']],
  },
  tree: {
    chars: [
      [' ', '♣', ' '],
      [' ', '♣', ' '],
      [' ', '|', ' '],
    ],
  },
  bush: {
    chars: [['♠', '♠']],
  },
  rock: {
    chars: [['▄', '█']],
  },
  mushroom: {
    chars: [
      ['●'],
      ['│'],
    ],
  },
  sign: {
    chars: [
      ['┌', '─', '┐'],
      ['│', '♦', '│'],
      [' ', '│', ' '],
    ],
  },
  'fruit-tree': {
    chars: [
      [' ', '♦', ' '],
      [' ', '♣', ' '],
      [' ', '|', ' '],
    ],
  },
  wheat: {
    chars: [
      ['≈'],
      ['|'],
    ],
  },
  lantern: {
    chars: [
      ['◆'],
      ['│'],
    ],
  },
  snowtree: {
    chars: [
      [' ', '▲', ' '],
      [' ', '▲', ' '],
      [' ', '|', ' '],
    ],
  },
  crystal: {
    chars: [
      ['◇'],
      ['△'],
    ],
  },
  'star-flower': {
    chars: [['✦']],
  },
};

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

// ── Path height (sum of sines for winding trail) ──

export function pathCenterRow(col: number, cols: number, rows: number, amplitude: number = 0.5): number {
  const t = col / cols;
  const baseRow = rows * 0.78;
  const wave = Math.sin(t * Math.PI * 3.0 + 0.8) * amplitude * 3
             + Math.sin(t * Math.PI * 1.5 + 2.1) * amplitude * 2;
  return Math.round(baseRow + wave);
}

// ── Time-of-day color interpolation ──

export function getTimeOfDayColors(
  baseTop: string,
  baseBottom: string,
  timeOfDay: number,
): { top: string; bottom: string } {
  // timeOfDay: 0=midnight, 0.25=dawn, 0.5=noon, 0.75=dusk
  const nightTop = '#050510';
  const nightBottom = '#0D1B2A';

  if (timeOfDay <= 0.15) {
    // Night
    return { top: nightTop, bottom: nightBottom };
  } else if (timeOfDay <= 0.35) {
    // Dawn transition
    const t = (timeOfDay - 0.15) / 0.2;
    return {
      top: lerpColor(nightTop, baseTop, t),
      bottom: lerpColor(nightBottom, baseBottom, t),
    };
  } else if (timeOfDay <= 0.65) {
    // Day
    return { top: baseTop, bottom: baseBottom };
  } else if (timeOfDay <= 0.85) {
    // Dusk transition
    const t = (timeOfDay - 0.65) / 0.2;
    return {
      top: lerpColor(baseTop, nightTop, t),
      bottom: lerpColor(baseBottom, nightBottom, t),
    };
  }
  // Night
  return { top: nightTop, bottom: nightBottom };
}

// ── Generate seasonal ground elements ──

export function generateSeasonElements(
  season: Season,
  cols: number,
  rows: number,
  density: number = 0.5,
): GroundElement[] {
  const elements: GroundElement[] = [];
  const spacing = Math.max(6, Math.floor(20 * (1 - density)));

  const seasonTypes: Record<Season, GroundElement['type'][]> = {
    spring: ['sapling', 'flower', 'flower', 'bush', 'mushroom'],
    summer: ['tree', 'flower', 'bush', 'bush', 'rock'],
    autumn: ['fruit-tree', 'wheat', 'wheat', 'bush', 'lantern', 'rock'],
    winter: ['snowtree', 'crystal', 'rock', 'star-flower', 'snowtree'],
  };

  const types = seasonTypes[season];

  for (let c = 4; c < cols - 4; c += spacing) {
    const jitter = Math.floor(hash(c, 777) * spacing * 0.5);
    const col = c + jitter;
    if (col >= cols - 2) continue;

    const typeIdx = Math.floor(hash(col, 888) * types.length);
    const growth = 0.3 + hash(col, 999) * 0.7;

    elements.push({
      col,
      type: types[typeIdx],
      growth,
      id: `${season}-${col}-${types[typeIdx]}`,
    });
  }

  return elements;
}

// ── Main scene computation ──

export function computeScene(config: SceneConfig): AsciiCell[][] {
  const {
    cols, rows, clouds, showHills,
    skyColorTop, skyColorBottom, cloudColor,
    hillColor, hillColorFar, time,
    season, path, groundElements, timeOfDay,
  } = config;

  // Apply time-of-day color shifting
  const todColors = timeOfDay !== undefined
    ? getTimeOfDayColors(skyColorTop, skyColorBottom, timeOfDay)
    : { top: skyColorTop, bottom: skyColorBottom };

  const grid: AsciiCell[][] = [];

  // Precompute hill heights
  const hillHeights: number[] = [];
  if (showHills) {
    for (let c = 0; c < cols; c++) {
      const hNorm = hillHeight(c, cols);
      const hillRows = Math.floor(rows * 0.30);
      hillHeights[c] = rows - Math.floor(hNorm * hillRows);
    }
  }

  // Precompute path rows
  const pathRows: number[] = [];
  const pathWidth = 3;
  if (path?.enabled) {
    for (let c = 0; c < cols; c++) {
      pathRows[c] = pathCenterRow(c, cols, rows, path.amplitude ?? 0.5);
    }
  }

  // Build element lookup: col → { row, element }
  const elementLookup = new Map<string, { element: GroundElement; char: string; color: string }>();
  if (groundElements) {
    const palette = season ? SEASON_PALETTES[season] : SEASON_PALETTES.summer;
    for (const el of groundElements) {
      if (el.growth < 0.1) continue;
      const shape = ELEMENT_SHAPES[el.type];
      if (!shape) continue;

      // Place element above the path or hill line
      let baseRow: number;
      if (path?.enabled && pathRows[el.col] !== undefined) {
        baseRow = pathRows[el.col] - shape.chars.length;
      } else if (showHills && hillHeights[el.col] !== undefined) {
        baseRow = hillHeights[el.col] - shape.chars.length;
      } else {
        baseRow = rows - shape.chars.length - 2;
      }

      const elColor = getElementColor(el.type, season || 'summer', palette, time);

      for (let sr = 0; sr < shape.chars.length; sr++) {
        const shapeRow = shape.chars[sr];
        for (let sc = 0; sc < shapeRow.length; sc++) {
          const ch = shapeRow[sc];
          if (ch === ' ') continue;
          const gc = el.col + sc - Math.floor(shapeRow.length / 2);
          const gr = baseRow + sr;
          if (gc >= 0 && gc < cols && gr >= 0 && gr < rows) {
            elementLookup.set(`${gr},${gc}`, { element: el, char: ch, color: elColor });
          }
        }
      }
    }
  }

  for (let r = 0; r < rows; r++) {
    const row: AsciiCell[] = [];
    for (let c = 0; c < cols; c++) {
      const rowFrac = r / (rows - 1);

      // ── Layer 1: Sky gradient ──
      const skyColor = lerpColor(todColors.top, todColors.bottom, rowFrac);
      const skyCharIdx = Math.floor(hash(c, r) * SKY_CHARS.length);
      let char = SKY_CHARS[skyCharIdx];
      let color = skyColor;
      let elementId: string | undefined;

      // Stars (more visible at night/winter)
      const starThreshold = season === 'winter' ? 0.93 : (timeOfDay !== undefined && (timeOfDay < 0.2 || timeOfDay > 0.8)) ? 0.94 : 0.97;
      if (r < rows * 0.25 && hash(c + Math.floor(time * 0.3), r) > starThreshold) {
        const twinkle = Math.sin(time * 2 + c * 0.5 + r * 0.3) * 0.5 + 0.5;
        char = twinkle > 0.5 ? '✦' : '·';
        color = season === 'winter' ? lerpColor('#6688AA', '#00D4FF', twinkle) : '#FFFFFF';
      }

      // ── Layer 2: Clouds ──
      const { density: cDensity } = cloudDensityAt(c, r, clouds, cols);
      if (cDensity > 0.05) {
        const charIdx = Math.min(
          CLOUD_CHARS_BY_DENSITY.length - 1,
          Math.floor(cDensity * CLOUD_CHARS_BY_DENSITY.length),
        );
        char = CLOUD_CHARS_BY_DENSITY[charIdx];
        color = rgbWithAlpha(cloudColor, 0.4 + cDensity * 0.6);
      }

      // ── Layer 3: Hills ──
      if (showHills && hillHeights[c] !== undefined && r >= hillHeights[c]) {
        const depth = (r - hillHeights[c]) / (rows - hillHeights[c]);
        const hillCharIdx = Math.min(
          HILL_CHARS.length - 1,
          Math.floor(hash(c, r + 500) * HILL_CHARS.length),
        );

        if (r === hillHeights[c]) {
          char = depth < 0.3 ? '^' : HILL_CHARS[hillCharIdx];
        } else {
          char = HILL_CHARS[hillCharIdx];
        }

        color = lerpColor(hillColorFar, hillColor, 1 - depth * 0.6);

        // Seasonal ground variation
        if (season === 'autumn' && hash(c, r + 300) > 0.85) {
          color = lerpColor(color, '#D4781E', 0.4);
        } else if (season === 'winter' && hash(c, r + 300) > 0.7) {
          color = lerpColor(color, '#C8D8E8', 0.5);
          if (hash(c, r + 400) > 0.9) char = '·';
        } else if (season === 'spring' && hash(c, r + 300) > 0.92) {
          char = '·';
          color = '#E8A0BF';
        }
      }

      // ── Layer 4: Path ──
      if (path?.enabled && pathRows[c] !== undefined) {
        const center = pathRows[c];
        const dist = Math.abs(r - center);
        if (dist <= pathWidth) {
          if (dist === pathWidth) {
            char = PATH_BORDER_CHARS[Math.floor(hash(c, r + 200) * PATH_BORDER_CHARS.length)];
            color = path.borderColor || '#8B7355';
          } else {
            char = PATH_CHARS[Math.floor(hash(c, r + 100) * PATH_CHARS.length)];
            color = path.color || '#C4A882';
          }
        }
      }

      // ── Layer 5: Ground elements ──
      const elKey = `${r},${c}`;
      const elData = elementLookup.get(elKey);
      if (elData) {
        char = elData.char;
        color = elData.color;
        elementId = elData.element.id;
      }

      row.push({ char, color, elementId });
    }
    grid.push(row);
  }

  return grid;
}

function getElementColor(type: GroundElement['type'], season: Season, palette: typeof SEASON_PALETTES[Season], time: number): string {
  switch (type) {
    case 'flower':
    case 'star-flower':
      return season === 'spring' ? '#E8A0BF' : season === 'winter' ? '#00D4FF' : palette.groundAccent;
    case 'sapling':
    case 'bush':
      return palette.hillColor;
    case 'tree':
    case 'fruit-tree':
      return palette.hillColor;
    case 'rock':
      return season === 'winter' ? '#6B7B8D' : '#8B8B7A';
    case 'mushroom':
      return '#CD853F';
    case 'sign':
      return '#A0845C';
    case 'wheat':
      return '#DAA520';
    case 'lantern': {
      const flicker = Math.sin(time * 4) * 0.2 + 0.8;
      return lerpColor('#D4781E', '#FFD700', flicker);
    }
    case 'snowtree':
      return '#8BA8C0';
    case 'crystal':
      return lerpColor('#00D4FF', '#B266FF', Math.sin(time * 1.5) * 0.5 + 0.5);
    default:
      return palette.groundAccent;
  }
}

// ── Serialise grid to color-batched HTML ──
// Groups consecutive cells with the same color into a single <span>.
// Cells with elementId get their own span with a data attribute for interactivity.

export function gridToHtml(grid: AsciiCell[][]): string {
  const parts: string[] = [];

  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    let runColor = row[0]?.color ?? '';
    let runChars = '';
    let runElementId = row[0]?.elementId;

    for (let c = 0; c < row.length; c++) {
      const cell = row[c];
      if (cell.color === runColor && cell.elementId === runElementId) {
        runChars += cell.char;
      } else {
        flushRun(parts, runColor, runChars, runElementId);
        runColor = cell.color;
        runChars = cell.char;
        runElementId = cell.elementId;
      }
    }
    if (runChars) {
      flushRun(parts, runColor, runChars, runElementId);
    }
    if (r < grid.length - 1) parts.push('\n');
  }

  return parts.join('');
}

function flushRun(parts: string[], color: string, chars: string, elementId?: string): void {
  if (elementId) {
    parts.push(`<span data-element="${escapeHtml(elementId)}" style="color:${color};cursor:pointer" class="world-element">${escapeHtml(chars)}</span>`);
  } else {
    parts.push(`<span style="color:${color}">${escapeHtml(chars)}</span>`);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
