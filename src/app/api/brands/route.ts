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

// GET /api/brands - Fetch user's brands
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const brands = await prisma.brand.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    // Parse JSON fields
    const parsedBrands = brands.map(brand => ({
      id: brand.id,
      name: brand.name,
      colors: JSON.parse(brand.colors),
      tone: JSON.parse(brand.tone),
      keywords: JSON.parse(brand.keywords),
      doPatterns: JSON.parse(brand.doPatterns),
      dontPatterns: JSON.parse(brand.dontPatterns),
      voiceSamples: JSON.parse(brand.voiceSamples),
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    }));

    return NextResponse.json({ brands: parsedBrands });
  } catch (error) {
    console.error('[Brands API] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/brands - Create a new brand
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name = 'New Brand',
      colors = { primary: '#000000', secondary: '#ffffff', accent: '#6366f1' },
      tone = { minimal: 50, playful: 50, bold: 50, experimental: 30 },
      keywords = [],
      doPatterns = [],
      dontPatterns = [],
      voiceSamples = [],
    } = body;

    const brand = await prisma.brand.create({
      data: {
        name,
        colors: JSON.stringify(colors),
        tone: JSON.stringify(tone),
        keywords: JSON.stringify(keywords),
        doPatterns: JSON.stringify(doPatterns),
        dontPatterns: JSON.stringify(dontPatterns),
        voiceSamples: JSON.stringify(voiceSamples),
        userId: user.id,
      },
    });

    return NextResponse.json({
      brand: {
        id: brand.id,
        name: brand.name,
        colors: JSON.parse(brand.colors),
        tone: JSON.parse(brand.tone),
        keywords: JSON.parse(brand.keywords),
        doPatterns: JSON.parse(brand.doPatterns),
        dontPatterns: JSON.parse(brand.dontPatterns),
        voiceSamples: JSON.parse(brand.voiceSamples),
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[Brands API] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/brands - Update a brand
export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existingBrand = await prisma.brand.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingBrand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Build update data
    const updateData: Record<string, string> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.colors !== undefined) updateData.colors = JSON.stringify(updates.colors);
    if (updates.tone !== undefined) updateData.tone = JSON.stringify(updates.tone);
    if (updates.keywords !== undefined) updateData.keywords = JSON.stringify(updates.keywords);
    if (updates.doPatterns !== undefined) updateData.doPatterns = JSON.stringify(updates.doPatterns);
    if (updates.dontPatterns !== undefined) updateData.dontPatterns = JSON.stringify(updates.dontPatterns);
    if (updates.voiceSamples !== undefined) updateData.voiceSamples = JSON.stringify(updates.voiceSamples);

    const brand = await prisma.brand.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      brand: {
        id: brand.id,
        name: brand.name,
        colors: JSON.parse(brand.colors),
        tone: JSON.parse(brand.tone),
        keywords: JSON.parse(brand.keywords),
        doPatterns: JSON.parse(brand.doPatterns),
        dontPatterns: JSON.parse(brand.dontPatterns),
        voiceSamples: JSON.parse(brand.voiceSamples),
        createdAt: brand.createdAt,
        updatedAt: brand.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Brands API] PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/brands?id=xxx - Delete a brand
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Brand ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existingBrand = await prisma.brand.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingBrand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    await prisma.brand.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Brands API] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
