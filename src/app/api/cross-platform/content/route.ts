import { NextRequest, NextResponse } from 'next/server';
import { ManualContentInputSchema, normalizeManualInput } from '@/lib/cross-platform';

/**
 * POST /api/cross-platform/content
 * Accept manually pasted content and normalize it into a ContentItem.
 * Supports pasting text, transcript, or media URLs for any platform.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = ManualContentInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const contentItem = normalizeManualInput(parsed.data);

    return NextResponse.json({
      item: contentItem,
      message: 'Content normalized successfully. Use /api/cross-platform/analyze to run voice analysis.',
    });
  } catch (error) {
    console.error('Content normalization error:', error);
    return NextResponse.json(
      { error: 'Failed to process content' },
      { status: 500 }
    );
  }
}
