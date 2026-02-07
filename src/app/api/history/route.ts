import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import prisma from '@/lib/db';

// Helper to get authenticated user
async function getAuthUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;

  if (!accessToken) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { supabaseId: user.id },
  });

  return dbUser;
}

// GET /api/history - Fetch history for user's brands
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get brandId filter from query params (optional)
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Get user's brand IDs
    const userBrands = await prisma.brand.findMany({
      where: { userId: user.id },
      select: { id: true, name: true },
    });

    const brandIds = userBrands.map(b => b.id);
    const brandNameMap = Object.fromEntries(userBrands.map(b => [b.id, b.name]));

    if (brandIds.length === 0) {
      return NextResponse.json({ history: [] });
    }

    // Build where clause
    const whereClause = brandId
      ? { brandId, brand: { userId: user.id } }
      : { brandId: { in: brandIds } };

    const historyEntries = await prisma.historyEntry.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    // Transform to match HistoryItem interface
    const history = historyEntries.map(entry => ({
      id: entry.id,
      type: entry.type as 'check' | 'generate',
      brandId: entry.brandId,
      brandName: brandNameMap[entry.brandId] || 'Unknown Brand',
      input: entry.input,
      contentType: entry.contentType || undefined,
      output: JSON.parse(entry.output),
      timestamp: entry.createdAt,
    }));

    return NextResponse.json({ history });
  } catch (error) {
    console.error('[History API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/history - Save a new history entry
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, brandId, input, contentType, output } = body;

    if (!type || !brandId || !input || output === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: type, brandId, input, output' },
        { status: 400 }
      );
    }

    // Verify user owns the brand
    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Extract score from output if it's a check result
    let score: number | undefined;
    if (type === 'check' && typeof output === 'object' && output.score !== undefined) {
      score = output.score;
    }

    const entry = await prisma.historyEntry.create({
      data: {
        type,
        input,
        output: JSON.stringify(output),
        contentType: contentType || null,
        score: score || null,
        brandId,
      },
    });

    return NextResponse.json({
      entry: {
        id: entry.id,
        type: entry.type,
        brandId: entry.brandId,
        brandName: brand.name,
        input: entry.input,
        contentType: entry.contentType || undefined,
        output: JSON.parse(entry.output),
        timestamp: entry.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[History API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/history?id=xxx - Delete a history entry
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'History entry ID is required' }, { status: 400 });
    }

    // Verify user owns the history entry's brand
    const entry = await prisma.historyEntry.findUnique({
      where: { id },
      include: { brand: { select: { userId: true } } },
    });

    if (!entry || entry.brand.userId !== user.id) {
      return NextResponse.json({ error: 'History entry not found' }, { status: 404 });
    }

    await prisma.historyEntry.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[History API] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
