import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  fetchTranscript,
  createManualTranscript,
  detectVideoSource,
} from '@/lib/cross-platform/transcript-engine';
import { normalizeManualInput } from '@/lib/cross-platform/normalizers';
import { analyzeVoiceConsistencyForContent } from '@/lib/cross-platform/voice-engine';
import { SocialPlatformSchema } from '@/lib/cross-platform/schemas';
import type { VoiceFingerprint } from '@/lib/voice-fingerprint';

const VideoCheckRequestSchema = z.object({
  videoUrl: z.string().url().optional(),
  manualTranscript: z.string().optional(),
  platform: SocialPlatformSchema.optional(),
  fingerprintJson: z.string().optional(),
  fallbackDescription: z.string().optional(),
}).refine(
  (data) => data.videoUrl || data.manualTranscript,
  { message: 'Provide either a videoUrl or manualTranscript' }
);

/**
 * POST /api/cross-platform/video-check
 * Check a video's transcript against brand voice.
 * Accepts a video URL (auto-extracts transcript) or a manually pasted transcript.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = VideoCheckRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { videoUrl, manualTranscript, platform, fingerprintJson, fallbackDescription } = parsed.data;

    // Step 1: Get transcript
    let transcriptText: string | null = null;
    let transcriptSource: string = 'manual';
    let detectedPlatform = platform ?? 'youtube';

    if (videoUrl) {
      const source = detectVideoSource(videoUrl);
      if (source) {
        detectedPlatform = source.platform;
      }

      const result = await fetchTranscript(videoUrl);
      if (result) {
        transcriptText = result.text;
        transcriptSource = result.source;
      }
    }

    if (!transcriptText && manualTranscript) {
      transcriptText = manualTranscript;
      transcriptSource = 'manual';
    }

    if (!transcriptText) {
      return NextResponse.json(
        {
          error: 'Could not obtain transcript. Paste the transcript manually or try a different video.',
        },
        { status: 404 }
      );
    }

    // Step 2: Normalize as a ContentItem with transcript
    const contentItem = normalizeManualInput({
      platform: detectedPlatform,
      contentType: 'video',
      transcript: transcriptText,
    });

    // Step 3: Parse fingerprint
    let fingerprint: VoiceFingerprint | null = null;
    if (fingerprintJson) {
      try {
        fingerprint = JSON.parse(fingerprintJson);
      } catch {
        // Ignore invalid fingerprint — will use fallback
      }
    }

    // Step 4: Run voice consistency analysis on transcript
    const report = await analyzeVoiceConsistencyForContent([contentItem], {
      fingerprint,
      fallbackDescription,
    });

    return NextResponse.json({
      report,
      transcript: {
        text: transcriptText.substring(0, 2000) + (transcriptText.length > 2000 ? '...' : ''),
        fullLength: transcriptText.length,
        wordCount: transcriptText.split(/\s+/).length,
        source: transcriptSource,
      },
      meta: {
        platform: detectedPlatform,
        videoUrl: videoUrl ?? null,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Video brand check error:', error);
    return NextResponse.json(
      { error: 'Video brand check failed' },
      { status: 500 }
    );
  }
}
