import { NextRequest, NextResponse } from 'next/server';
import {
  CrossPlatformVoiceAnalysisRequestSchema,
  analyzeVoiceConsistencyForContent,
  analyzeVoiceConsistencyByPlatform,
  computeCrossPlatformVoiceScore,
} from '@/lib/cross-platform';
import type { VoiceFingerprint } from '@/lib/voice-fingerprint';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CrossPlatformVoiceAnalysisRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { items, fingerprintJson, fallbackDescription } = parsed.data;

    let fingerprint: VoiceFingerprint | null = null;
    if (fingerprintJson) {
      try {
        fingerprint = JSON.parse(fingerprintJson);
      } catch {
        return NextResponse.json(
          { error: 'Invalid fingerprint JSON' },
          { status: 400 }
        );
      }
    }

    const platforms = [...new Set(items.map((i) => i.platform))];
    const isMultiPlatform = platforms.length > 1;

    // Run overall analysis
    const overallReport = await analyzeVoiceConsistencyForContent(items, {
      fingerprint,
      fallbackDescription,
    });

    // If multi-platform, also run per-platform breakdown
    let perPlatformReports = null;
    let crossPlatformVoice = null;

    if (isMultiPlatform) {
      perPlatformReports = await analyzeVoiceConsistencyByPlatform(items, {
        fingerprint,
        fallbackDescription,
      });

      crossPlatformVoice = computeCrossPlatformVoiceScore(perPlatformReports);
    }

    return NextResponse.json({
      overallReport,
      perPlatformReports,
      crossPlatformVoice,
      meta: {
        totalItems: items.length,
        platforms,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Cross-platform analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
