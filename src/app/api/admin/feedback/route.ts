import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Simple admin key check
const ADMIN_KEY = process.env.ADMIN_API_KEY;

function isAuthorized(request: NextRequest): boolean {
  if (process.env.NODE_ENV === 'development') return true;

  const authHeader = request.headers.get('authorization');
  const apiKey = authHeader?.replace('Bearer ', '');
  return apiKey === ADMIN_KEY && !!ADMIN_KEY;
}

export interface FeedbackItem {
  id: string;
  userId: string | null;
  userName: string | null;
  userHandle: string | null;
  type: string;
  category: string | null;
  message: string;
  rating: number | null;
  url: string | null;
  status: string;
  priority: string | null;
  adminNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedbackStats {
  total: number;
  new: number;
  inProgress: number;
  resolved: number;
  bugs: number;
  ideas: number;
  avgRating: number | null;
  npsScore: number | null;
}

// GET /api/admin/feedback - List all feedback with stats
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (type) where.type = type;

    // Fetch feedback with user info
    const feedbackItems = await prisma.feedback.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            xUsername: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Get total count
    const totalCount = await prisma.feedback.count({ where });

    // Calculate stats
    const allFeedback = await prisma.feedback.findMany({
      select: {
        status: true,
        type: true,
        rating: true,
      },
    });

    const stats: FeedbackStats = {
      total: allFeedback.length,
      new: allFeedback.filter(f => f.status === 'new').length,
      inProgress: allFeedback.filter(f => f.status === 'in_progress').length,
      resolved: allFeedback.filter(f => f.status === 'resolved').length,
      bugs: allFeedback.filter(f => f.type === 'bug').length,
      ideas: allFeedback.filter(f => f.type === 'idea').length,
      avgRating: null,
      npsScore: null,
    };

    // Calculate average rating (for non-NPS ratings)
    const ratingsNonNps = allFeedback
      .filter(f => f.rating !== null && f.type !== 'nps')
      .map(f => f.rating as number);

    if (ratingsNonNps.length > 0) {
      stats.avgRating = Math.round(
        (ratingsNonNps.reduce((a, b) => a + b, 0) / ratingsNonNps.length) * 10
      ) / 10;
    }

    // Calculate NPS score
    const npsRatings = allFeedback
      .filter(f => f.type === 'nps' && f.rating !== null)
      .map(f => f.rating as number);

    if (npsRatings.length > 0) {
      const promoters = npsRatings.filter(r => r >= 9).length;
      const detractors = npsRatings.filter(r => r <= 6).length;
      stats.npsScore = Math.round(
        ((promoters - detractors) / npsRatings.length) * 100
      );
    }

    // Format feedback items
    const feedback: FeedbackItem[] = feedbackItems.map(f => ({
      id: f.id,
      userId: f.userId,
      userName: f.user?.name || null,
      userHandle: f.user?.xUsername || null,
      type: f.type,
      category: f.category,
      message: f.message,
      rating: f.rating,
      url: f.url,
      status: f.status,
      priority: f.priority,
      adminNotes: f.adminNotes,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    }));

    return NextResponse.json({
      stats,
      feedback,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount,
      },
    });
  } catch (error) {
    console.error('[Admin/Feedback] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/feedback - Update feedback status, priority, or notes
export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, status, priority, adminNotes } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['new', 'reviewed', 'in_progress', 'resolved', 'wont_fix'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'critical'];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: 'Invalid priority' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: {
      status?: string;
      priority?: string;
      adminNotes?: string;
    } = {};

    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid update fields provided' },
        { status: 400 }
      );
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            xUsername: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      feedback: {
        id: updatedFeedback.id,
        userId: updatedFeedback.userId,
        userName: updatedFeedback.user?.name || null,
        userHandle: updatedFeedback.user?.xUsername || null,
        type: updatedFeedback.type,
        category: updatedFeedback.category,
        message: updatedFeedback.message,
        rating: updatedFeedback.rating,
        url: updatedFeedback.url,
        status: updatedFeedback.status,
        priority: updatedFeedback.priority,
        adminNotes: updatedFeedback.adminNotes,
        createdAt: updatedFeedback.createdAt,
        updatedAt: updatedFeedback.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Admin/Feedback] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update feedback' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/feedback - Delete feedback
export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Feedback ID is required' },
        { status: 400 }
      );
    }

    await prisma.feedback.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Feedback deleted successfully',
    });
  } catch (error) {
    console.error('[Admin/Feedback] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete feedback' },
      { status: 500 }
    );
  }
}
