import { NextRequest, NextResponse } from 'next/server';
import type { Brand } from '@prisma/client';
import prisma from '@/lib/db';
import { getWorkspaceContext, ownedBrandWhere } from '@/lib/workspace-auth';

// Brand CRUD, workspace-scoped (Phase 1 model). Legacy rows (userId set,
// workspaceId null) are adopted into the caller's personal workspace on GET,
// so every other handler can scope by workspaceId alone plus the legacy
// fallback for clients that write before their first read.

// Request bodies carry brand text corpora (voice samples etc.) but anything
// beyond this is abuse, not usage.
const MAX_BODY_BYTES = 200_000;

async function readJsonBody(request: NextRequest): Promise<Record<string, unknown> | null> {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function serializeBrand(brand: Brand) {
  return {
    id: brand.id,
    name: brand.name,
    colors: JSON.parse(brand.colors),
    tone: JSON.parse(brand.tone),
    keywords: JSON.parse(brand.keywords),
    doPatterns: JSON.parse(brand.doPatterns),
    dontPatterns: JSON.parse(brand.dontPatterns),
    voiceSamples: JSON.parse(brand.voiceSamples),
    // Stored as a JSON string and consumed as one client-side — pass through.
    voiceFingerprint: brand.voiceFingerprint,
    workspaceId: brand.workspaceId,
    createdAt: brand.createdAt,
    updatedAt: brand.updatedAt,
  };
}

// GET /api/brands - Fetch the workspace's brands
export async function GET() {
  try {
    const ctx = await getWorkspaceContext({ ensure: true });
    if (!ctx || !ctx.workspace) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Adopt legacy rows (pre-workspace) owned by this user.
    await prisma.brand.updateMany({
      where: { userId: ctx.user.id, workspaceId: null },
      data: { workspaceId: ctx.workspace.id },
    });

    const brands = await prisma.brand.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({
      brands: brands.map(serializeBrand),
      workspaceId: ctx.workspace.id,
    });
  } catch (error) {
    console.error('[Brands API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/brands - Create a new brand in the workspace
export async function POST(request: NextRequest) {
  try {
    const ctx = await getWorkspaceContext({ ensure: true });
    if (!ctx || !ctx.workspace) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await readJsonBody(request);
    if (!body) {
      return NextResponse.json({ error: 'Invalid or oversized body' }, { status: 400 });
    }

    const {
      name = 'New Brand',
      colors = { primary: '#000000', secondary: '#ffffff', accent: '#6366f1' },
      tone = { minimal: 50, playful: 50, bold: 50, experimental: 30 },
      keywords = [],
      doPatterns = [],
      dontPatterns = [],
      voiceSamples = [],
      voiceFingerprint = null,
    } = body;

    if (typeof name !== 'string' || name.length > 200) {
      return NextResponse.json({ error: 'Invalid brand name' }, { status: 400 });
    }

    const brand = await prisma.brand.create({
      data: {
        name,
        colors: JSON.stringify(colors),
        tone: JSON.stringify(tone),
        keywords: JSON.stringify(keywords),
        doPatterns: JSON.stringify(doPatterns),
        dontPatterns: JSON.stringify(dontPatterns),
        voiceSamples: JSON.stringify(voiceSamples),
        voiceFingerprint: typeof voiceFingerprint === 'string' ? voiceFingerprint : null,
        userId: ctx.user.id,
        workspaceId: ctx.workspace.id,
      },
    });

    return NextResponse.json({ brand: serializeBrand(brand) }, { status: 201 });
  } catch (error) {
    console.error('[Brands API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/brands - Update a brand in the workspace
export async function PUT(request: NextRequest) {
  try {
    const ctx = await getWorkspaceContext({ ensure: true });
    if (!ctx || !ctx.workspace) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await readJsonBody(request);
    if (!body) {
      return NextResponse.json({ error: 'Invalid or oversized body' }, { status: 400 });
    }

    const { id, ...updates } = body;
    if (typeof id !== 'string' || !id) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 });
    }

    const existingBrand = await prisma.brand.findFirst({
      where: ownedBrandWhere(id, ctx.workspace.id, ctx.user.id),
    });

    if (!existingBrand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const updateData: Record<string, string | null> = {};
    if (typeof updates.name === 'string' && updates.name.length <= 200)
      updateData.name = updates.name;
    if (updates.colors !== undefined) updateData.colors = JSON.stringify(updates.colors);
    if (updates.tone !== undefined) updateData.tone = JSON.stringify(updates.tone);
    if (updates.keywords !== undefined) updateData.keywords = JSON.stringify(updates.keywords);
    if (updates.doPatterns !== undefined)
      updateData.doPatterns = JSON.stringify(updates.doPatterns);
    if (updates.dontPatterns !== undefined)
      updateData.dontPatterns = JSON.stringify(updates.dontPatterns);
    if (updates.voiceSamples !== undefined)
      updateData.voiceSamples = JSON.stringify(updates.voiceSamples);
    if (updates.voiceFingerprint !== undefined)
      updateData.voiceFingerprint =
        typeof updates.voiceFingerprint === 'string' ? updates.voiceFingerprint : null;

    const brand = await prisma.brand.update({
      where: { id: existingBrand.id },
      // Adopt on write for legacy rows so subsequent reads are workspace-scoped
      data: { ...updateData, workspaceId: ctx.workspace.id },
    });

    return NextResponse.json({ brand: serializeBrand(brand) });
  } catch (error) {
    console.error('[Brands API] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/brands?id=xxx - Delete a brand in the workspace
export async function DELETE(request: NextRequest) {
  try {
    const ctx = await getWorkspaceContext({ ensure: true });
    if (!ctx || !ctx.workspace) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 });
    }

    const existingBrand = await prisma.brand.findFirst({
      where: ownedBrandWhere(id, ctx.workspace.id, ctx.user.id),
    });

    if (!existingBrand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    await prisma.brand.delete({ where: { id: existingBrand.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Brands API] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
