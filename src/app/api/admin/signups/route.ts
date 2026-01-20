import { NextRequest, NextResponse } from 'next/server';
import { getAllSignups, getSignupCount, getSignupsBySource } from '@/lib/newsletter';

// Simple admin key check - in production use proper auth
const ADMIN_KEY = process.env.ADMIN_API_KEY;

function isAuthorized(request: NextRequest): boolean {
  // In development, allow access
  if (process.env.NODE_ENV === 'development') return true;
  
  // In production, require API key
  const authHeader = request.headers.get('authorization');
  const apiKey = authHeader?.replace('Bearer ', '');
  return apiKey === ADMIN_KEY && !!ADMIN_KEY;
}

export async function GET(request: NextRequest) {
  // Check authorization
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const countOnly = searchParams.get('count') === 'true';

    if (countOnly) {
      const count = await getSignupCount();
      return NextResponse.json({ count });
    }

    const signups = source 
      ? await getSignupsBySource(source)
      : await getAllSignups();

    // Group by source for summary
    const bySource: Record<string, number> = {};
    signups.forEach(s => {
      bySource[s.source] = (bySource[s.source] || 0) + 1;
    });

    return NextResponse.json({
      total: signups.length,
      bySource,
      signups: signups.map(s => ({
        email: s.email,
        source: s.source,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error('[Admin/Signups] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signups' },
      { status: 500 }
    );
  }
}
