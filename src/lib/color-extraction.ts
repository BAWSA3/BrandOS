// =============================================================================
// COLOR EXTRACTION UTILITY
// Extracts dominant colors from profile pictures using node-vibrant
// =============================================================================

import { Vibrant } from 'node-vibrant/node';
import fs from 'fs';
import path from 'path';
import os from 'os';

export interface ExtractedColors {
  primary: string;
  secondary: string;
  accent: string;
  palette: string[];
}

// Default fallback colors
const DEFAULT_COLORS: ExtractedColors = {
  primary: '#0047FF',
  secondary: '#1a1a1a',
  accent: '#10B981',
  palette: [],
};

/**
 * Convert RGB array to hex string
 */
function rgbToHex(rgb: number[]): string {
  return '#' + rgb.map(c => c.toString(16).padStart(2, '0')).join('');
}

/**
 * Convert hex to RGB
 */
function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  return [
    parseInt(cleanHex.substring(0, 2), 16),
    parseInt(cleanHex.substring(2, 4), 16),
    parseInt(cleanHex.substring(4, 6), 16),
  ];
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  s /= 100;
  l /= 100;

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Convert HSL to hex
 */
function hslToHex(h: number, s: number, l: number): string {
  const [r, g, b] = hslToRgb(h, s, l);
  return rgbToHex([r, g, b]);
}

/**
 * Generate harmonious colors based on color theory
 * Uses split-complementary scheme for visually pleasing combinations
 */
export function generateHarmoniousColors(primaryHex: string): { secondary: string; accent: string } {
  try {
    const [r, g, b] = hexToRgb(primaryHex);
    const [h, s, l] = rgbToHsl(r, g, b);

    // For secondary: use an analogous color (30 degrees offset)
    // Slightly adjust saturation and lightness for better contrast
    const secondaryHue = (h + 30) % 360;
    const secondarySat = Math.min(100, Math.max(30, s * 0.8));
    const secondaryLight = l > 50 ? Math.max(20, l - 25) : Math.min(80, l + 25);
    const secondary = hslToHex(secondaryHue, secondarySat, secondaryLight);

    // For accent: use split-complementary (150 degrees offset)
    // Keep it vibrant with higher saturation
    const accentHue = (h + 150) % 360;
    const accentSat = Math.min(100, Math.max(50, s + 20));
    const accentLight = Math.min(70, Math.max(40, 55));
    const accent = hslToHex(accentHue, accentSat, accentLight);

    return { secondary, accent };
  } catch {
    return { secondary: '#1a1a1a', accent: '#10B981' };
  }
}

/**
 * Generate only the accent color harmoniously based on primary
 * Uses split-complementary (150 degrees offset) for visual pop
 */
export function generateHarmoniousAccent(primaryHex: string): string {
  try {
    const [r, g, b] = hexToRgb(primaryHex);
    const [h, s] = rgbToHsl(r, g, b);

    // Use split-complementary (150 degrees offset)
    const accentHue = (h + 150) % 360;
    const accentSat = Math.min(100, Math.max(50, s + 20));
    const accentLight = Math.min(70, Math.max(40, 55));

    return hslToHex(accentHue, accentSat, accentLight);
  } catch {
    return '#10B981';
  }
}

/**
 * Calculate color brightness (0-255)
 */
function getColorBrightness(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * Check if a color is too dark or too light to be usable
 */
function isUsableColor(hex: string): boolean {
  const brightness = getColorBrightness(hex);
  return brightness > 30 && brightness < 230;
}

/**
 * Calculate color distance (simple Euclidean in RGB space)
 */
function colorDistance(hex1: string, hex2: string): number {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  return Math.sqrt(
    Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
  );
}

/**
 * Find the most vibrant usable color from palette
 */
function findBestPrimaryColor(palette: string[]): string {
  let bestColor = palette[0];
  let bestScore = -1;

  for (const color of palette) {
    if (!isUsableColor(color)) continue;

    const [r, g, b] = hexToRgb(color);
    const [, s, l] = rgbToHsl(r, g, b);

    // Score based on saturation and avoid extreme lightness
    const lightnessScore = 1 - Math.abs(l - 50) / 50;
    const score = s * lightnessScore;

    if (score > bestScore) {
      bestScore = score;
      bestColor = color;
    }
  }

  return bestColor;
}

/**
 * Find the second best color from palette that's different from primary
 */
function findSecondaryColor(palette: string[], primaryColor: string): string {
  let bestColor = palette[1] || palette[0];
  let bestScore = -1;
  const MIN_DISTANCE = 50; // Minimum color distance to be considered different

  for (const color of palette) {
    if (color === primaryColor) continue;

    const distance = colorDistance(color, primaryColor);
    if (distance < MIN_DISTANCE) continue; // Too similar to primary

    const [r, g, b] = hexToRgb(color);
    const [, s, l] = rgbToHsl(r, g, b);

    // Score based on being usable and reasonably saturated
    const usabilityScore = isUsableColor(color) ? 1 : 0.3;
    const saturationScore = Math.min(s / 50, 1); // Prefer some saturation
    const lightnessScore = 1 - Math.abs(l - 50) / 50;
    const distanceScore = Math.min(distance / 100, 1); // Prefer distinct colors

    const score = usabilityScore * (saturationScore + lightnessScore + distanceScore);

    if (score > bestScore) {
      bestScore = score;
      bestColor = color;
    }
  }

  return bestColor;
}

/**
 * Extract dominant colors from an image URL
 * Uses node-vibrant to analyze the image and return a color palette
 */
export async function extractColorsFromImage(
  imageUrl: string
): Promise<ExtractedColors> {
  let tempPath: string | null = null;

  try {
    // Upgrade to higher resolution image (Twitter uses _normal for small)
    const highResUrl = imageUrl.replace('_normal', '_400x400');

    // Fetch the image
    console.log('=== FETCHING IMAGE FOR COLOR EXTRACTION (node-vibrant) ===');
    console.log('URL:', highResUrl);

    const response = await fetch(highResUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      console.warn('Failed to fetch image:', response.status);
      return DEFAULT_COLORS;
    }

    const buffer = Buffer.from(await response.arrayBuffer());

    if (buffer.length === 0) {
      console.warn('Empty image buffer');
      return DEFAULT_COLORS;
    }

    // Save to temp file (node-vibrant works with file paths in Node.js)
    tempPath = path.join(os.tmpdir(), `brandos-pfp-${Date.now()}.jpg`);
    fs.writeFileSync(tempPath, buffer);
    console.log('Saved temp image:', tempPath, 'Size:', buffer.length);

    // Extract palette using node-vibrant
    const palette = await Vibrant.from(tempPath).getPalette();

    if (!palette) {
      console.warn('No palette extracted');
      return DEFAULT_COLORS;
    }

    // Build hex palette from vibrant swatches
    const swatches = [
      palette.Vibrant,
      palette.DarkVibrant,
      palette.LightVibrant,
      palette.Muted,
      palette.DarkMuted,
      palette.LightMuted,
    ].filter(Boolean);

    if (swatches.length === 0) {
      console.warn('No valid swatches found');
      return DEFAULT_COLORS;
    }

    // Convert swatches to hex colors
    const hexPalette = swatches.map(swatch => swatch!.hex);
    console.log('=== EXTRACTED COLORS FROM PFP (node-vibrant) ===');
    console.log('Raw Palette:', hexPalette);

    // Find the best primary color (most vibrant and usable)
    const primary = findBestPrimaryColor(hexPalette) || DEFAULT_COLORS.primary;

    // Find the secondary color from the palette (different from primary)
    const secondary = findSecondaryColor(hexPalette, primary);

    // Generate only the accent color harmoniously based on primary
    const accent = generateHarmoniousAccent(primary);

    console.log('Primary (extracted):', primary);
    console.log('Secondary (extracted):', secondary);
    console.log('Accent (harmonious):', accent);

    return {
      primary,
      secondary,
      accent,
      palette: hexPalette,
    };
  } catch (error) {
    console.error('Color extraction error:', error);
    return DEFAULT_COLORS;
  } finally {
    // Cleanup temp file
    if (tempPath && fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Check if extracted colors are valid (not all defaults)
 */
export function hasValidExtractedColors(colors: ExtractedColors): boolean {
  return (
    colors.primary !== DEFAULT_COLORS.primary ||
    colors.secondary !== DEFAULT_COLORS.secondary
  );
}
