import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ContentItemSchema, SocialPlatformSchema } from '@/lib/cross-platform/schemas';
import { computeCrossPlatformBrandScore } from '@/lib/cross-platform/scoring-engine';
import type { VoiceFingerprint } from '@/lib/voice-fingerprint';
import type { SocialPlatform } from '@/lib/cross-platform/types';

const ScoreRequestSchema = z.object({
  items: z.array(ContentItemSchema).min(1, 'At least one content item required'),
  fingerprintJson: z.string().optional(),
  fallbackDescription: z.string().optional(),
  visualScores: z.record(SocialPlatformSchema, z.number().min(0).max(100)).optional(),
});

/**
 * POST /api/cross-platform/score
 * Compute the unified cross-platform brand consistency score.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ScoreRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { items, fingerprintJson, fallbackDescription, visualScores } = parsed.data;

    let fingerprint: VoiceFingerprint | null = null;
    if (fingerprintJson) {
      try {
        fingerprint = JSON.parse(fingerprintJson);
      } catch {
        // Ignore invalid fingerprint
      }
    }

    const score = await computeCrossPlatformBrandScore(items, {
      fingerprint,
      fallbackDescription,
      visualScores: visualScores as Partial<Record<SocialPlatform, number>> | undefined,
    });

    return NextResponse.json({ score });
  } catch (error) {
    console.error('Cross-platform score error:', error);
    return NextResponse.json(
      { error: 'Failed to compute cross-platform score' },
      { status: 500 }
    );
  }
}
