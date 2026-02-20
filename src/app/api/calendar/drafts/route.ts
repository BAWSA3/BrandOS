import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/db';

async function getAuthenticatedUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  if (!accessToken) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user: authUser }, error } = await supabase.auth.getUser(accessToken);
  if (error || !authUser) return null;

  return prisma.user.findUnique({ where: { supabaseId: authUser.id } });
}

// GET /api/calendar/drafts?brandId=...&from=...&to=...&status=...
export async function GET(request: NextRequest) {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: dbUser.id },
    });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const status = searchParams.get('status');
    const unscheduled = searchParams.get('unscheduled') === 'true';

    // Build where clause
    const where: Record<string, unknown> = { brandId };
    if (status) where.status = status;

    if (unscheduled) {
      where.scheduledFor = null;
    } else if (from || to) {
      const scheduledFilter: Record<string, Date> = {};
      if (from) scheduledFilter.gte = new Date(from);
      if (to) scheduledFilter.lte = new Date(to);
      where.scheduledFor = scheduledFilter;
    }

    const drafts = await prisma.contentDraft.findMany({
      where,
      orderBy: [{ scheduledFor: 'asc' }, { createdAt: 'desc' }],
      include: {
        children: { select: { id: true } },
        parent: { select: { id: true, content: true, contentType: true } },
      },
    });

    return NextResponse.json({
      drafts: drafts.map(d => ({
        id: d.id,
        content: d.content,
        contentType: d.contentType,
        tone: d.tone,
        status: d.status,
        scheduledFor: d.scheduledFor?.toISOString() || null,
        sourceType: d.sourceType,
        sourceId: d.sourceId,
        authenticity: d.authenticity,
        parentId: d.parentId,
        parent: d.parent,
        childrenCount: d.children.length,
        createdAt: d.createdAt.toISOString(),
        updatedAt: d.updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error('[calendar/drafts] GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/calendar/drafts
export async function POST(request: NextRequest) {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { brandId, content, contentType, tone, status, scheduledFor, sourceType, sourceId, parentId, authenticity } = body;

    if (!brandId || !content) {
      return NextResponse.json({ error: 'brandId and content are required' }, { status: 400 });
    }

    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: dbUser.id },
    });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const draft = await prisma.contentDraft.create({
      data: {
        brandId,
        content,
        contentType: contentType || 'tweet',
        tone: tone || 'casual',
        status: status || 'idea',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        sourceType: sourceType || 'manual',
        sourceId: sourceId || null,
        parentId: parentId || null,
        authenticity: authenticity ?? null,
      },
    });

    return NextResponse.json({
      draft: {
        id: draft.id,
        content: draft.content,
        contentType: draft.contentType,
        tone: draft.tone,
        status: draft.status,
        scheduledFor: draft.scheduledFor?.toISOString() || null,
        sourceType: draft.sourceType,
        sourceId: draft.sourceId,
        authenticity: draft.authenticity,
        parentId: draft.parentId,
        childrenCount: 0,
        createdAt: draft.createdAt.toISOString(),
        updatedAt: draft.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[calendar/drafts] POST error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
