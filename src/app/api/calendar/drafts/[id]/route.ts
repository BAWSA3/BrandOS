import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getWorkspaceContext, ownedBrandsWhere } from '@/lib/workspace-auth';
import { readJsonBody } from '@/lib/api-body';
import {
  MAX_DRAFT_CHARS,
  isDraftStatus,
  isDraftContentType,
  parseScheduledFor,
  parseAuthenticity,
  serializeDraft,
} from '@/lib/calendar-drafts';

// Single-draft update/delete, workspace-scoped (consolidation step 6).
// Ownership resolves through the draft's brand with the same scope the list
// route uses: the caller's workspace, plus legacy userId rows pre-adoption
// (a null workspace still owns its legacy rows).

const MAX_BODY_BYTES = 50_000;

// PATCH /api/calendar/drafts/[id]
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getWorkspaceContext({ ensure: false });
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const read = await readJsonBody(request, MAX_BODY_BYTES);
    if (!read.ok) return read.response;
    const body = read.body;

    const ownedBrand = ownedBrandsWhere(ctx.workspace?.id ?? null, ctx.user.id);
    const existing = await prisma.contentDraft.findFirst({
      where: { id, brand: ownedBrand },
      select: { id: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (body.content !== undefined) {
      const content = typeof body.content === 'string' ? body.content.trim() : '';
      if (!content || content.length > MAX_DRAFT_CHARS) {
        return NextResponse.json(
          { error: `Content must be 1–${MAX_DRAFT_CHARS} characters` },
          { status: 400 }
        );
      }
      updateData.content = content;
    }
    if (body.contentType !== undefined) {
      if (!isDraftContentType(body.contentType)) {
        return NextResponse.json({ error: 'Invalid contentType' }, { status: 400 });
      }
      updateData.contentType = body.contentType;
    }
    if (body.tone !== undefined && typeof body.tone === 'string') {
      updateData.tone = body.tone.slice(0, 100);
    }
    if (body.status !== undefined) {
      if (!isDraftStatus(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updateData.status = body.status;
    }
    if (body.authenticity !== undefined) {
      const authenticity = parseAuthenticity(body.authenticity);
      if (authenticity === undefined) {
        return NextResponse.json({ error: 'Invalid authenticity value' }, { status: 400 });
      }
      updateData.authenticity = authenticity;
    }
    if (body.scheduledFor !== undefined) {
      const scheduledFor = parseScheduledFor(body.scheduledFor);
      if (scheduledFor === undefined) {
        return NextResponse.json({ error: 'Invalid scheduledFor date' }, { status: 400 });
      }
      updateData.scheduledFor = scheduledFor;
    }

    const draft = await prisma.contentDraft.update({
      where: { id },
      data: updateData,
      include: {
        children: { select: { id: true } },
        parent: { select: { id: true, content: true, contentType: true } },
      },
    });

    return NextResponse.json({ draft: serializeDraft(draft) });
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
    const ctx = await getWorkspaceContext({ ensure: false });
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Ownership check and delete in one round trip: deleteMany accepts the
    // relation filter, and count === 0 covers both missing and not-owned.
    const { count } = await prisma.contentDraft.deleteMany({
      where: { id, brand: ownedBrandsWhere(ctx.workspace?.id ?? null, ctx.user.id) },
    });
    if (count === 0) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[calendar/drafts/[id]] DELETE error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
