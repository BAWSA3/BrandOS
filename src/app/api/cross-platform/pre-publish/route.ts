import { NextRequest, NextResponse } from 'next/server';
import { PrePublishCheckRequestSchema } from '@/lib/cross-platform/schemas';
import {
  runPrePublishCheck,
  quickPrePublishCheck,
} from '@/lib/cross-platform/pre-publish-engine';
import type { BrandDNA } from '@/lib/types';
import type { VoiceFingerprint } from '@/lib/voice-fingerprint';

/**
 * POST /api/cross-platform/pre-publish
 * Check content before posting — voice alignment, tone, platform best practices.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = PrePublishCheckRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { content, platform, contentType, brandDnaJson, voiceFingerprintJson } = parsed.data;

    let brandDNA: BrandDNA;
    try {
      brandDNA = JSON.parse(brandDnaJson);
    } catch {
      return NextResponse.json(
        { error: 'Invalid Brand DNA JSON' },
        { status: 400 }
      );
    }

    let fingerprint: VoiceFingerprint | null = null;
    if (voiceFingerprintJson) {
      try {
        fingerprint = JSON.parse(voiceFingerprintJson);
      } catch {
        // Non-blocking — proceed without fingerprint
      }
    }

    // Run quick heuristic check first (instant)
    const quickCheck = quickPrePublishCheck(content, platform);

    // Run full AI-powered check
    const fullCheck = await runPrePublishCheck(content, platform, brandDNA, {
      contentType: contentType ?? undefined,
      fingerprint,
    });

    if (!fullCheck) {
      return NextResponse.json({
        quickCheck,
        fullCheck: null,
        error: 'AI-powered check failed. Quick check results are available.',
      });
    }

    // Merge quick check issues into the full result if not duplicated
    const allIssues = [...fullCheck.issues];
    for (const quickIssue of quickCheck.issues) {
      const isDuplicate = allIssues.some((i) =>
        i.message.toLowerCase().includes(quickIssue.message.toLowerCase().substring(0, 30))
      );
      if (!isDuplicate) {
        allIssues.push(quickIssue);
      }
    }

    return NextResponse.json({
      check: {
        ...fullCheck,
        issues: allIssues,
      },
      meta: {
        platform,
        contentLength: content.length,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Pre-publish check error:', error);
    return NextResponse.json(
      { error: 'Pre-publish check failed' },
      { status: 500 }
    );
  }
}
