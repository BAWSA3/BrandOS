import { NextRequest, NextResponse } from 'next/server';
import type { Brand } from '@prisma/client';
import prisma from '@/lib/db';
import { getCurrentUser, getCurrentWorkspace, ensurePersonalWorkspace } from '@/lib/auth';

// Check/generate history, workspace-scoped (consolidation step 4). The old
// route read the dead sb-access-token cookie — this is the route that
// existed since Phase-0 but was never wired to a UI; the dashboard Content
// Check panel is its first real consumer.

const MAX_BODY_BYTES = 150_000;

async function getAuthContext() {
  const user = await getCurrentUser();
  if (!user) return null;
  const workspace =
    (await getCurrentWorkspace(user)) ??
    (await ensurePersonalWorkspace(user.id, user.name ?? undefined));
  return { user, workspace };
}

// Brands the caller may read/write history for: their workspace's brands,
// plus legacy rows they own that haven't been adopted yet.
function ownedBrandsWhere(workspaceId: string, userId: string) {
  return { OR: [{ workspaceId }, { userId, workspaceId: null }] };
}

function serializeEntry(
  entry: {
    id: string;
    type: string;
    brandId: string;
    input: string;
    contentType: string | null;
    output: string;
    createdAt: Date;
  },
  brandName: string
) {
  return {
    id: entry.id,
    type: entry.type as 'check' | 'generate',
    brandId: entry.brandId,
    brandName,
    input: entry.input,
    contentType: entry.contentType || undefined,
    output: JSON.parse(entry.output),
    timestamp: entry.createdAt,
  };
}

// GET /api/history - Fetch history for the workspace's brands
export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10) || 50, 200);

    const brands = await prisma.brand.findMany({
      where: ownedBrandsWhere(ctx.workspace.id, ctx.user.id),
      select: { id: true, name: true },
    });
    const brandNameMap = Object.fromEntries(
      brands.map((b: Pick<Brand, 'id' | 'name'>) => [b.id, b.name])
    );
    const brandIds = brandId
      ? brands.filter((b) => b.id === brandId).map((b) => b.id)
      : brands.map((b) => b.id);

    if (brandIds.length === 0) {
      return NextResponse.json({ history: [] });
    }

    const historyEntries = await prisma.historyEntry.findMany({
      where: { brandId: { in: brandIds } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({
      history: historyEntries.map((e) =>
        serializeEntry(e, brandNameMap[e.brandId] || 'Unknown Brand')
      ),
    });
  } catch (error) {
    console.error('[History API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/history - Save a new history entry
export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
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

    const { type, brandId, input, contentType, output } = body;

    if (
      typeof type !== 'string' ||
      !['check', 'generate'].includes(type) ||
      typeof brandId !== 'string' ||
      typeof input !== 'string' ||
      output === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: type, brandId, input, output' },
        { status: 400 }
      );
    }

    // The brand must belong to the caller's workspace (or be a legacy row
    // they own).
    const brand = await prisma.brand.findFirst({
      where: { id: brandId, ...ownedBrandsWhere(ctx.workspace.id, ctx.user.id) },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    let score: number | undefined;
    if (type === 'check' && typeof output === 'object' && output !== null) {
      const s = (output as Record<string, unknown>).score;
      if (typeof s === 'number') score = s;
    }

    const entry = await prisma.historyEntry.create({
      data: {
        type,
        input,
        output: JSON.stringify(output),
        contentType: typeof contentType === 'string' ? contentType : null,
        score: score ?? null,
        brandId,
      },
    });

    return NextResponse.json({ entry: serializeEntry(entry, brand.name) }, { status: 201 });
  } catch (error) {
    console.error('[History API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/history?id=xxx - Delete a history entry
export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getAuthContext();
    if (!ctx) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'History entry ID is required' }, { status: 400 });
    }

    const entry = await prisma.historyEntry.findUnique({
      where: { id },
      include: { brand: { select: { userId: true, workspaceId: true } } },
    });

    const owned =
      entry &&
      (entry.brand.workspaceId === ctx.workspace.id ||
        (entry.brand.userId === ctx.user.id && entry.brand.workspaceId === null));

    if (!owned) {
      return NextResponse.json({ error: 'History entry not found' }, { status: 404 });
    }

    await prisma.historyEntry.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[History API] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
