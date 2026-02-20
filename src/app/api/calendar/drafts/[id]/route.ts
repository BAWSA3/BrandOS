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

// PATCH /api/calendar/drafts/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Find draft and verify ownership through brand
    const existing = await prisma.contentDraft.findUnique({
      where: { id },
      include: { brand: { select: { userId: true } } },
    });

    if (!existing || existing.brand.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.content !== undefined) updateData.content = body.content;
    if (body.contentType !== undefined) updateData.contentType = body.contentType;
    if (body.tone !== undefined) updateData.tone = body.tone;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.authenticity !== undefined) updateData.authenticity = body.authenticity;
    if (body.scheduledFor !== undefined) {
      updateData.scheduledFor = body.scheduledFor ? new Date(body.scheduledFor) : null;
    }

    const draft = await prisma.contentDraft.update({
      where: { id },
      data: updateData,
      include: {
        children: { select: { id: true } },
        parent: { select: { id: true, content: true, contentType: true } },
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
        parent: draft.parent,
        childrenCount: draft.children.length,
        createdAt: draft.createdAt.toISOString(),
        updatedAt: draft.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('[calendar/drafts/[id]] PATCH error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/calendar/drafts/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dbUser = await getAuthenticatedUser();
    if (!dbUser) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.contentDraft.findUnique({
      where: { id },
      include: { brand: { select: { userId: true } } },
    });

    if (!existing || existing.brand.userId !== dbUser.id) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    await prisma.contentDraft.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[calendar/drafts/[id]] DELETE error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
