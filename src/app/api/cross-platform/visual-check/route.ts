import { NextRequest, NextResponse } from 'next/server';
import { VisualConsistencyRequestSchema } from '@/lib/cross-platform/schemas';
import {
  analyzeVisualConsistency,
  auditVisualConsistency,
} from '@/lib/cross-platform/visual-engine';
import type { VisualDNA } from '@/lib/cross-platform/types';

/**
 * POST /api/cross-platform/visual-check
 * Analyze image(s) against brand Visual DNA for visual consistency.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = VisualConsistencyRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { imageUrls, visualDnaJson, brandDnaJson } = parsed.data;

    let visualDNA: VisualDNA;

    if (visualDnaJson) {
      try {
        visualDNA = JSON.parse(visualDnaJson);
      } catch {
        return NextResponse.json(
          { error: 'Invalid Visual DNA JSON' },
          { status: 400 }
        );
      }
    } else if (brandDnaJson) {
      // Extract visual signals from brand DNA as fallback
      try {
        const brandDNA = JSON.parse(brandDnaJson);
        visualDNA = {
          logoUsageRules: ['Maintain consistent logo placement'],
          colorPalette: {
            primary: brandDNA.colors?.primary ?? brandDNA.primaryColor?.hex ?? '#000000',
            secondary: brandDNA.colors?.secondary ?? brandDNA.secondaryColor?.hex ?? '#666666',
            accent: brandDNA.colors?.accent ?? '#0066FF',
            tolerancePercent: 20,
          },
          typography: { style: 'sans-serif' },
          imageStyle: 'mixed',
          moodKeywords: brandDNA.brandKeywords ?? brandDNA.keywords ?? [],
        };
      } catch {
        return NextResponse.json(
          { error: 'Invalid Brand DNA JSON' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Either visualDnaJson or brandDnaJson is required' },
        { status: 400 }
      );
    }

    if (imageUrls.length === 1) {
      const result = await analyzeVisualConsistency(imageUrls[0], visualDNA);

      if (!result) {
        return NextResponse.json(
          { error: 'Visual analysis failed. Ensure the image URL is publicly accessible.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ result, mode: 'single' });
    }

    // Multi-image audit
    const audit = await auditVisualConsistency(imageUrls, visualDNA);
    return NextResponse.json({ audit, mode: 'multi' });
  } catch (error) {
    console.error('Visual check error:', error);
    return NextResponse.json(
      { error: 'Visual consistency check failed' },
      { status: 500 }
    );
  }
}
