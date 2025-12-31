// =============================================================================
// COLOR EXTRACTION UTILITY
// Extracts dominant colors from profile pictures using colorthief
// =============================================================================

import ColorThief from 'colorthief';
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
 * Generate a complementary accent color
 */
function generateAccentColor(hex: string): string {
  try {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    // Create a vibrant accent by shifting hue
    const newR = Math.min(255, Math.max(0, (r + 128) % 256));
    const newG = Math.min(255, Math.max(0, (g + 64) % 256));
    const newB = Math.min(255, Math.max(0, (b + 192) % 256));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  } catch {
    return '#10B981';
  }
}

/**
 * Extract dominant colors from an image URL
 * Uses colorthief to analyze the image and return a color palette
 */
export async function extractColorsFromImage(
  imageUrl: string
): Promise<ExtractedColors> {
  let tempPath: string | null = null;

  try {
    // Upgrade to higher resolution image (Twitter uses _normal for small)
    const highResUrl = imageUrl.replace('_normal', '_400x400');

    // Fetch the image
    console.log('=== FETCHING IMAGE FOR COLOR EXTRACTION ===');
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

    // Save to temp file (colorthief requires a file path)
    tempPath = path.join(os.tmpdir(), `brandos-pfp-${Date.now()}.jpg`);
    fs.writeFileSync(tempPath, buffer);
    console.log('Saved temp image:', tempPath, 'Size:', buffer.length);

    // Extract palette using ColorThief
    const palette = await ColorThief.getPalette(tempPath, 6);

    if (!palette || palette.length === 0) {
      console.warn('No palette extracted');
      return DEFAULT_COLORS;
    }

    // Convert to hex colors
    const hexPalette = palette.map(rgbToHex);
    console.log('=== EXTRACTED COLORS FROM PFP ===');
    console.log('Palette:', hexPalette);

    // Pick primary (most dominant), secondary, and accent
    const primary = hexPalette[0] || DEFAULT_COLORS.primary;
    const secondary = hexPalette[1] || hexPalette[2] || DEFAULT_COLORS.secondary;

    // For accent, try to find a more vibrant color or generate one
    let accent = hexPalette[3] || hexPalette[4] || generateAccentColor(primary);

    // If accent is too similar to primary, generate a complementary one
    if (accent === primary) {
      accent = generateAccentColor(primary);
    }

    console.log('Primary:', primary);
    console.log('Secondary:', secondary);
    console.log('Accent:', accent);

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
