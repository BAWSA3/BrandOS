import { NextRequest, NextResponse } from 'next/server';
import { TranscriptRequestSchema } from '@/lib/cross-platform/schemas';
import {
  fetchTranscript,
  detectVideoSource,
} from '@/lib/cross-platform/transcript-engine';

/**
 * POST /api/cross-platform/transcript
 * Extract transcript from a video URL (YouTube, TikTok).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = TranscriptRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { videoUrl } = parsed.data;

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    const source = detectVideoSource(videoUrl);
    if (!source) {
      return NextResponse.json(
        {
          error: 'Unsupported video URL. Supported: YouTube, TikTok.',
          supportedFormats: [
            'https://youtube.com/watch?v=...',
            'https://youtu.be/...',
            'https://youtube.com/shorts/...',
            'https://tiktok.com/@user/video/...',
          ],
        },
        { status: 400 }
      );
    }

    const transcript = await fetchTranscript(videoUrl);

    if (!transcript) {
      return NextResponse.json(
        {
          error: 'Could not extract transcript. The video may not have captions available.',
          platform: source.platform,
          videoId: source.videoId,
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      transcript,
      meta: {
        platform: source.platform,
        videoId: source.videoId,
        extractedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Transcript extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract transcript' },
      { status: 500 }
    );
  }
}
