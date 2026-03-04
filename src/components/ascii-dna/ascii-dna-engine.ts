/* ────────────────────────────────────────────────────────────
   ASCII DNA Helix Engine — Pure TypeScript computation
   Double helix made of scrolling text characters on a
   Klein blue canvas with spring-physics mouse displacement.
   No React, no DOM — just math → Canvas.
   ──────────────────────────────────────────────────────────── */

export interface DNACell {
  char: string;
  opacity: number;
  displaceX: number;
  displaceY: number;
  targetDX: number;
  targetDY: number;
  isStrand: boolean; // true = strand char, false = rung or empty
}

export interface DNAConfig {
  cols: number;
  rows: number;
  amplitude: number;       // helix half-width in columns
  frequency: number;       // full rotations visible
  strandWidth: number;     // chars wide per strand (2-3)
  textSource: string;      // repeating text
  textOffset: number;      // scrolling offset (incremented each frame)
  rungSpacing: number;     // rows between rungs
  centerCol: number;       // column center of helix
}

export interface MouseState {
  x: number; // pixel x relative to canvas
  y: number; // pixel y relative to canvas
  active: boolean;
}

const TWO_PI = Math.PI * 2;

/**
 * Pre-allocate a grid of DNACells.
 */
export function createGrid(cols: number, rows: number): DNACell[][] {
  const grid: DNACell[][] = new Array(rows);
  for (let r = 0; r < rows; r++) {
    grid[r] = new Array(cols);
    for (let c = 0; c < cols; c++) {
      grid[r][c] = {
        char: '',
        opacity: 0,
        displaceX: 0,
        displaceY: 0,
        targetDX: 0,
        targetDY: 0,
        isStrand: false,
      };
    }
  }
  return grid;
}

/**
 * Fill grid with the DNA helix shape.
 * Two sine waves offset by π form the double helix.
 * Characters are sampled from textSource with scrolling offset.
 */
export function computeDNAGrid(grid: DNACell[][], config: DNAConfig): void {
  const { cols, rows, amplitude, frequency, strandWidth, textSource, textOffset, rungSpacing, centerCol } = config;
  const textLen = textSource.length;
  let strandCharIdx1 = 0;
  let strandCharIdx2 = 0;

  for (let r = 0; r < rows; r++) {
    // Phase for this row
    const phase = TWO_PI * frequency * (r / rows);

    // Strand 1 center column
    const s1Center = centerCol + amplitude * Math.sin(phase);
    // Strand 2 center column (offset by π)
    const s2Center = centerCol + amplitude * Math.sin(phase + Math.PI);

    // Depth (z) for front/back: cos determines which strand is in front
    const cos1 = Math.cos(phase);
    const cos2 = Math.cos(phase + Math.PI); // = -cos1

    // Opacity based on depth (back strand dimmer)
    const opacity1 = 0.3 + 0.7 * Math.abs(cos1);
    const opacity2 = 0.3 + 0.7 * Math.abs(cos2);

    // Determine if strand1 is in front
    const strand1InFront = cos1 >= cos2;

    // Clear row
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      cell.char = '';
      cell.opacity = 0;
      cell.isStrand = false;
      // Keep displacement — it persists across frames for spring physics
    }

    // Draw halo (dim characters around the strands for volume)
    const halfStrand = Math.floor(strandWidth / 2);
    const haloWidth = 2; // extra chars on each side
    for (const sCenter of [s1Center, s2Center]) {
      const sInt = Math.round(sCenter);
      const haloLeft = sInt - halfStrand - haloWidth;
      const haloRight = sInt + halfStrand + haloWidth;
      const sOpacity = sCenter === s1Center ? opacity1 : opacity2;
      for (let c = haloLeft; c <= haloRight; c++) {
        if (c < 0 || c >= cols) continue;
        // Skip cells that will be overwritten by the strand itself
        const distFromCenter = Math.abs(c - sInt);
        if (distFromCenter <= halfStrand) continue;
        const haloFalloff = 1 - ((distFromCenter - halfStrand) / (haloWidth + 1));
        const haloOpacity = sOpacity * haloFalloff * 0.2;
        if (haloOpacity < 0.03) continue;
        const charI = ((c + r) + Math.floor(textOffset * 0.5)) % textLen;
        const ch = textSource[charI < 0 ? charI + textLen : charI];
        const cell = grid[r][c];
        cell.char = ch;
        cell.opacity = haloOpacity;
        cell.isStrand = false;
      }
    }

    // Draw rungs (connecting bars between strands, using text chars)
    const s1Int = Math.round(s1Center);
    const s2Int = Math.round(s2Center);
    const rungLeft = Math.min(s1Int, s2Int);
    const rungRight = Math.max(s1Int, s2Int);
    const strandDist = rungRight - rungLeft;

    if (r % rungSpacing === 0 && strandDist > 3 && strandDist < amplitude * 2.5) {
      // Blend opacity between the two strands
      const rungBaseOpacity = (opacity1 + opacity2) * 0.5;
      const rungOpacity = rungBaseOpacity * 0.35;
      let rungCharIdx = r * 3; // deterministic per row
      for (let c = rungLeft + 1; c < rungRight; c++) {
        if (c >= 0 && c < cols) {
          const charI = (rungCharIdx + Math.floor(textOffset)) % textLen;
          const ch = textSource[charI < 0 ? charI + textLen : charI];
          const cell = grid[r][c];
          cell.char = ch;
          cell.opacity = rungOpacity;
          cell.isStrand = false;
          rungCharIdx++;
        }
      }
    }

    // Helper to draw a strand
    const drawStrand = (center: number, opacity: number, charIdx: number): number => {
      const halfW = Math.floor(strandWidth / 2);
      const left = Math.round(center) - halfW;
      const right = left + strandWidth - 1;
      let idx = charIdx;

      for (let c = left; c <= right; c++) {
        if (c >= 0 && c < cols) {
          const charI = (idx + Math.floor(textOffset)) % textLen;
          const ch = textSource[charI < 0 ? charI + textLen : charI];
          const cell = grid[r][c];
          cell.char = ch;
          cell.opacity = opacity;
          cell.isStrand = true;
        }
        idx++;
      }
      return idx;
    };

    // Draw back strand first, then front (so front overwrites back on overlap)
    if (strand1InFront) {
      strandCharIdx2 = drawStrand(s2Center, opacity2, strandCharIdx2);
      strandCharIdx1 = drawStrand(s1Center, opacity1, strandCharIdx1);
    } else {
      strandCharIdx1 = drawStrand(s1Center, opacity1, strandCharIdx1);
      strandCharIdx2 = drawStrand(s2Center, opacity2, strandCharIdx2);
    }
  }
}

/**
 * Apply spring-physics displacement from mouse position.
 * Characters near the cursor are pushed away, then spring back.
 */
export function applyMouseDisplacement(
  grid: DNACell[][],
  mouse: MouseState,
  charW: number,
  charH: number,
  dt: number,
  radius: number,
  maxForce: number,
  springK: number,
  damping: number,
): void {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  // Convert mouse to grid coords
  const mx = mouse.x / charW;
  const my = mouse.y / charH;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];

      // Only process cells that have content
      if (!cell.char) {
        // Still spring back empty cells that were displaced
        if (cell.displaceX !== 0 || cell.displaceY !== 0) {
          cell.displaceX += (0 - cell.displaceX) * springK * dt;
          cell.displaceY += (0 - cell.displaceY) * springK * dt;
          if (Math.abs(cell.displaceX) < 0.1) cell.displaceX = 0;
          if (Math.abs(cell.displaceY) < 0.1) cell.displaceY = 0;
        }
        continue;
      }

      // Calculate displacement target from mouse
      let targetDX = 0;
      let targetDY = 0;

      if (mouse.active) {
        const dx = c - mx;
        const dy = r - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < radius && dist > 0.01) {
          // Quadratic falloff
          const falloff = 1 - (dist / radius);
          const force = falloff * falloff * maxForce;
          const nx = dx / dist;
          const ny = dy / dist;
          targetDX = nx * force;
          targetDY = ny * force;
        }
      }

      // Spring physics: interpolate toward target
      cell.displaceX += (targetDX - cell.displaceX) * springK * dt;
      cell.displaceY += (targetDY - cell.displaceY) * springK * dt;

      // Damping
      cell.displaceX *= damping;
      cell.displaceY *= damping;

      // Snap to zero when very small
      if (Math.abs(cell.displaceX) < 0.05 && Math.abs(targetDX) === 0) cell.displaceX = 0;
      if (Math.abs(cell.displaceY) < 0.05 && Math.abs(targetDY) === 0) cell.displaceY = 0;
    }
  }
}

/**
 * Render the grid to a canvas context.
 * Batches by opacity bucket to minimize fillStyle changes.
 */
export function renderToCanvas(
  ctx: CanvasRenderingContext2D,
  grid: DNACell[][],
  charW: number,
  charH: number,
  bgColor: string,
  textColor: string,
  width: number,
  height: number,
): void {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;

  // Clear with background color
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Collect cells by opacity bucket (0.1 increments)
  const buckets: Map<number, { char: string; x: number; y: number }[]> = new Map();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = grid[r][c];
      if (!cell.char) continue;

      // Round opacity to nearest 0.05 for batching
      const bucket = Math.round(cell.opacity * 20) / 20;
      if (bucket <= 0) continue;

      const x = c * charW + cell.displaceX;
      const y = r * charH + cell.displaceY;

      let list = buckets.get(bucket);
      if (!list) {
        list = [];
        buckets.set(bucket, list);
      }
      list.push({ char: cell.char, x, y });
    }
  }

  // Render each bucket
  ctx.textBaseline = 'top';

  for (const [opacity, cells] of buckets) {
    // Parse text color and apply opacity
    ctx.fillStyle = applyOpacity(textColor, opacity);
    for (const { char, x, y } of cells) {
      ctx.fillText(char, x, y);
    }
  }
}

/**
 * Apply opacity to a hex color string, returning rgba().
 */
function applyOpacity(hex: string, opacity: number): string {
  // Fast path for common case
  if (hex === '#ffffff' || hex === '#FFFFFF') {
    return `rgba(255,255,255,${opacity})`;
  }
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${opacity})`;
}
