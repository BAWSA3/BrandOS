// =============================================================================
// COLOR EXTRACTION UTILITY
// Extracts dominant colors from profile pictures using node-vibrant
// =============================================================================

import Vibrant from 'node-vibrant';

export interface ExtractedColors {
  primary: string;
  secondary: string;
  accent: string;
  palette: {
    vibrant: string | null;
    muted: string | null;
    darkVibrant: string | null;
    darkMuted: string | null;
    lightVibrant: string | null;
    lightMuted: string | null;
  };
}

// Default fallback colors
const DEFAULT_COLORS: ExtractedColors = {
  primary: '#0047FF',
  secondary: '#1a1a1a',
  accent: '#10B981',
  palette: {
    vibrant: null,
    muted: null,
    darkVibrant: null,
    darkMuted: null,
    lightVibrant: null,
    lightMuted: null,
  },
};

/**
 * Extract dominant colors from an image URL
 * Uses node-vibrant to analyze the image and return a color palette
 */
export async function extractColorsFromImage(
  imageUrl: string
): Promise<ExtractedColors> {
  try {
    // Upgrade to higher resolution image (Twitter uses _normal for small)
    const highResUrl = imageUrl.replace('_normal', '_400x400');

    // Fetch the image
    const response = await fetch(highResUrl);
    if (!response.ok) {
      console.warn('Failed to fetch image for color extraction:', response.status);
      return DEFAULT_COLORS;
    }

    // Convert to buffer for node-vibrant
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract palette using Vibrant
    const palette = await Vibrant.from(buffer).getPalette();

    // Build the full palette object
    const extractedPalette = {
      vibrant: palette.Vibrant?.hex || null,
      muted: palette.Muted?.hex || null,
      darkVibrant: palette.DarkVibrant?.hex || null,
      darkMuted: palette.DarkMuted?.hex || null,
      lightVibrant: palette.LightVibrant?.hex || null,
      lightMuted: palette.LightMuted?.hex || null,
    };

    // Determine primary color (prefer Vibrant, then DarkVibrant)
    const primary =
      extractedPalette.vibrant ||
      extractedPalette.darkVibrant ||
      extractedPalette.muted ||
      DEFAULT_COLORS.primary;

    // Determine secondary color (prefer Muted or DarkMuted for contrast)
    const secondary =
      extractedPalette.muted ||
      extractedPalette.darkMuted ||
      extractedPalette.darkVibrant ||
      DEFAULT_COLORS.secondary;

    // Determine accent color (prefer LightVibrant for pop)
    const accent =
      extractedPalette.lightVibrant ||
      extractedPalette.vibrant ||
      generateComplementaryColor(primary);

    // Ensure accent is different from primary
    const finalAccent = accent === primary ? generateComplementaryColor(primary) : accent;

    console.log('=== EXTRACTED COLORS FROM PFP ===');
    console.log('Primary:', primary);
    console.log('Secondary:', secondary);
    console.log('Accent:', finalAccent);
    console.log('Full palette:', extractedPalette);

    return {
      primary,
      secondary,
      accent: finalAccent,
      palette: extractedPalette,
    };
  } catch (error) {
    console.error('Color extraction error:', error);
    return DEFAULT_COLORS;
  }
}

/**
 * Generate a complementary color (simple hue shift)
 */
function generateComplementaryColor(hex: string): string {
  try {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);

    // Shift toward a complementary color
    const newR = Math.min(255, Math.max(0, 255 - r));
    const newG = Math.min(255, Math.max(0, 255 - g));
    const newB = Math.min(255, Math.max(0, 255 - b));

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  } catch {
    return '#10B981'; // Fallback accent
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
