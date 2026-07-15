import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getWorkspaceContext, ownedBrandWhere } from '@/lib/workspace-auth';
import {
  MAX_DRAFT_CHARS,
  isDraftStatus,
  isDraftContentType,
  isDraftSourceType,
  parseScheduledFor,
  parseAuthenticity,
  serializeDraft,
} from '@/lib/calendar-drafts';

// Content Calendar drafts, workspace-scoped (consolidation step 6). The old
// route read the dead sb-access-token cookie and checked brand.userId only,
// which broke for workspace-adopted brands and let a crafted parentId link
// (and read back) another user's draft.

const MAX_BODY_BYTES = 50_000;

// GET /api/calendar/drafts?brandId=...&from=...&to=...&status=...&unscheduled=true
export async function GET(request: NextRequest) {
  try {
    // Read path stays read-only: no workspace auto-creation on GET.
    const ctx = await getWorkspaceContext({ ensure: false });
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!ctx.workspace) {
      return NextResponse.json({ drafts: [] });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    const brand = await prisma.brand.findFirst({
      where: ownedBrandWhere(brandId, ctx.workspace.id, ctx.user.id),
      select: { id: true },
    });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const status = searchParams.get('status');
    const unscheduled = searchParams.get('unscheduled') === 'true';
    const from = parseScheduledFor(searchParams.get('from') ?? undefined);
    const to = parseScheduledFor(searchParams.get('to') ?? undefined);

    const where: Record<string, unknown> = { brandId };
    if (isDraftStatus(status)) where.status = status;

    if (unscheduled) {
      where.scheduledFor = null;
    } else if (from || to) {
      const scheduledFilter: Record<string, Date> = {};
      if (from) scheduledFilter.gte = from;
      if (to) scheduledFilter.lte = to;
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

    return NextResponse.json({ drafts: drafts.map(serializeDraft) });
  } catch (error) {
    console.error('[calendar/drafts] GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/calendar/drafts
export async function POST(request: NextRequest) {
  try {
    const ctx = await getWorkspaceContext({ ensure: true });
    if (!ctx || !ctx.workspace) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: 'Request too large' }, { status: 413 });
    }
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { brandId } = body;
    const content = typeof body.content === 'string' ? body.content.trim() : '';

    if (typeof brandId !== 'string' || !content) {
      return NextResponse.json({ error: 'brandId and content are required' }, { status: 400 });
    }
    if (content.length > MAX_DRAFT_CHARS) {
      return NextResponse.json(
        { error: `Content too long (max ${MAX_DRAFT_CHARS} characters)` },
        { status: 400 }
      );
    }

    const brand = await prisma.brand.findFirst({
      where: ownedBrandWhere(brandId, ctx.workspace.id, ctx.user.id),
      select: { id: true },
    });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const scheduledFor = parseScheduledFor(body.scheduledFor ?? null);
    if (scheduledFor === undefined) {
      return NextResponse.json({ error: 'Invalid scheduledFor date' }, { status: 400 });
    }

    // A repurpose chain must stay inside the brand — a foreign parentId
    // would leak the parent's content through the GET include.
    const parentId = typeof body.parentId === 'string' ? body.parentId : null;
    if (parentId) {
      const parent = await prisma.contentDraft.findFirst({
        where: { id: parentId, brandId },
        select: { id: true },
      });
      if (!parent) {
        return NextResponse.json({ error: 'Parent draft not found' }, { status: 404 });
      }
    }

    const draft = await prisma.contentDraft.create({
      data: {
        brandId,
        content,
        contentType: isDraftContentType(body.contentType) ? body.contentType : 'tweet',
        tone: typeof body.tone === 'string' ? body.tone.slice(0, 100) : 'casual',
        status: isDraftStatus(body.status) ? body.status : 'idea',
        scheduledFor,
        sourceType: isDraftSourceType(body.sourceType) ? body.sourceType : 'manual',
        // Opaque provenance marker (draft id or tweet id) — stored and echoed
        // back but never joined, unlike parentId.
        sourceId: typeof body.sourceId === 'string' ? body.sourceId.slice(0, 100) : null,
        parentId,
        authenticity: parseAuthenticity(body.authenticity),
      },
    });

    return NextResponse.json({ draft: serializeDraft(draft) }, { status: 201 });
  } catch (error) {
    console.error('[calendar/drafts] POST error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
