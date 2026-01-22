import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getUser } from '@/lib/auth';

// POST /api/feedback - Submit feedback (public, optionally authenticated)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, category, message, rating, url } = body;

    // Validate required fields
    if (!type || !message) {
      return NextResponse.json(
        { error: 'Type and message are required' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['bug', 'idea', 'other', 'nps', 'feature_request'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'Invalid feedback type' },
        { status: 400 }
      );
    }

    // Validate category if provided
    const validCategories = ['score_journey', 'brand_dna', 'agents', 'ui', 'performance', 'general'];
    if (category && !validCategories.includes(category)) {
      return NextResponse.json(
        { error: 'Invalid category' },
        { status: 400 }
      );
    }

    // Validate rating if provided (1-5 for stars, 0-10 for NPS)
    if (rating !== undefined) {
      if (type === 'nps' && (rating < 0 || rating > 10)) {
        return NextResponse.json(
          { error: 'NPS rating must be between 0 and 10' },
          { status: 400 }
        );
      }
      if (type !== 'nps' && (rating < 1 || rating > 5)) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        );
      }
    }

    // Try to get current user (optional - allow anonymous feedback)
    let userId: string | null = null;
    try {
      const user = await getUser();
      userId = user?.id || null;
    } catch {
      // Anonymous feedback is fine
    }

    // Collect metadata
    const userAgent = request.headers.get('user-agent') || '';
    const metadata = JSON.stringify({
      userAgent,
      timestamp: new Date().toISOString(),
    });

    // Create feedback entry
    const feedback = await prisma.feedback.create({
      data: {
        userId,
        type,
        category: category || null,
        message: message.trim(),
        rating: rating ?? null,
        url: url || null,
        metadata,
        status: 'new',
      },
    });

    return NextResponse.json({
      success: true,
      id: feedback.id,
      message: 'Feedback submitted successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('[Feedback] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

// GET /api/feedback - Get feedback stats (public endpoint for showing social proof)
export async function GET() {
  try {
    // Return anonymous stats only
    const totalFeedback = await prisma.feedback.count();
    const positiveCount = await prisma.feedback.count({
      where: {
        OR: [
          { type: 'idea' },
          { rating: { gte: 4 } },
        ],
      },
    });

    return NextResponse.json({
      total: totalFeedback,
      positive: positiveCount,
    });
  } catch (error) {
    console.error('[Feedback] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback stats' },
      { status: 500 }
    );
  }
}
