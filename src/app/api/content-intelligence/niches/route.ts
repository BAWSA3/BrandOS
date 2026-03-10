import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import prisma from '@/lib/db';

async function getAuthUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return null;

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  if (!accessToken) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user } } = await supabase.auth.getUser(accessToken);
  if (!user) return null;

  return prisma.user.findUnique({ where: { supabaseId: user.id } });
}

// GET /api/content-intelligence/niches?brandId=xxx
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const brandId = request.nextUrl.searchParams.get('brandId');
    if (!brandId) return NextResponse.json({ error: 'brandId required' }, { status: 400 });

    const brand = await prisma.brand.findFirst({ where: { id: brandId, userId: user.id } });
    if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

    const niches = await prisma.contentNiche.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ niches });
  } catch (error) {
    console.error('[niches] GET error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// POST /api/content-intelligence/niches
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const body = await request.json();
    const { brandId, name, keywords, hashtags, referenceAccounts, platform } = body;

    if (!brandId || !name) {
      return NextResponse.json({ error: 'brandId and name required' }, { status: 400 });
    }

    const brand = await prisma.brand.findFirst({ where: { id: brandId, userId: user.id } });
    if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

    const niche = await prisma.contentNiche.upsert({
      where: { brandId_name: { brandId, name } },
      update: {
        keywords: JSON.stringify(keywords || []),
        hashtags: JSON.stringify(hashtags || []),
        referenceAccounts: JSON.stringify(referenceAccounts || []),
        platform: platform || 'x',
        isActive: true,
      },
      create: {
        brandId,
        name,
        keywords: JSON.stringify(keywords || []),
        hashtags: JSON.stringify(hashtags || []),
        referenceAccounts: JSON.stringify(referenceAccounts || []),
        platform: platform || 'x',
      },
    });

    return NextResponse.json({ niche });
  } catch (error) {
    console.error('[niches] POST error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// DELETE /api/content-intelligence/niches
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    const { nicheId, brandId } = await request.json();
    if (!nicheId || !brandId) {
      return NextResponse.json({ error: 'nicheId and brandId required' }, { status: 400 });
    }

    const brand = await prisma.brand.findFirst({ where: { id: brandId, userId: user.id } });
    if (!brand) return NextResponse.json({ error: 'Brand not found' }, { status: 404 });

    await prisma.contentNiche.delete({ where: { id: nicheId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[niches] DELETE error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
