import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getWorkspaceContext, ownedBrandWhere } from '@/lib/workspace-auth';
import { readJsonBody } from '@/lib/api-body';
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
// (and read back) another user's draft. Ownership scope covers legacy
// pre-workspace rows too (ownedBrandWhere handles a null workspace).

const MAX_BODY_BYTES = 50_000;

// GET /api/calendar/drafts?brandId=...&from=...&to=...&status=...&unscheduled=true
export async function GET(request: NextRequest) {
  try {
    // Read path stays read-only: no workspace auto-creation on GET.
    const ctx = await getWorkspaceContext({ ensure: false });
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    if (!brandId) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }

    const brand = await prisma.brand.findFirst({
      where: ownedBrandWhere(brandId, ctx.workspace?.id ?? null, ctx.user.id),
      select: { id: true },
    });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Filters are pass-through (an unknown status just matches nothing), but
    // an unparseable date is a caller bug — reject rather than silently
    // returning the unfiltered full history.
    const status = searchParams.get('status');
    const unscheduled = searchParams.get('unscheduled') === 'true';
    const fromRaw = searchParams.get('from');
    const toRaw = searchParams.get('to');
    const from = fromRaw === null ? null : parseScheduledFor(fromRaw);
    const to = toRaw === null ? null : parseScheduledFor(toRaw);
    if (from === undefined || to === undefined) {
      return NextResponse.json({ error: 'Invalid from/to date' }, { status: 400 });
    }

    const where: Record<string, unknown> = { brandId };
    if (status) where.status = status.slice(0, 50);

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
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const read = await readJsonBody(request, MAX_BODY_BYTES);
    if (!read.ok) return read.response;
    const body = read.body;

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

    const scheduledFor = parseScheduledFor(body.scheduledFor ?? null);
    if (scheduledFor === undefined) {
      return NextResponse.json({ error: 'Invalid scheduledFor date' }, { status: 400 });
    }
    const authenticity = parseAuthenticity(body.authenticity ?? null);
    if (authenticity === undefined) {
      return NextResponse.json({ error: 'Invalid authenticity value' }, { status: 400 });
    }

    const workspaceId = ctx.workspace?.id ?? null;
    const parentId = typeof body.parentId === 'string' ? body.parentId : null;

    // Brand ownership and parent-chain ownership are independent checks —
    // run them together. A repurpose chain must stay inside the brand: a
    // foreign parentId would leak the parent's content through the GET
    // include.
    const [brand, parent] = await Promise.all([
      prisma.brand.findFirst({
        where: ownedBrandWhere(brandId, workspaceId, ctx.user.id),
        select: { id: true },
      }),
      parentId
        ? prisma.contentDraft.findFirst({ where: { id: parentId, brandId }, select: { id: true } })
        : Promise.resolve(null),
    ]);
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }
    if (parentId && !parent) {
      return NextResponse.json({ error: 'Parent draft not found' }, { status: 404 });
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
        authenticity,
      },
    });

    return NextResponse.json({ draft: serializeDraft(draft) }, { status: 201 });
  } catch (error) {
    console.error('[calendar/drafts] POST error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
