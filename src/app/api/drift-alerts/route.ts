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
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) return null;

  return prisma.user.findUnique({ where: { supabaseId: user.id } });
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    if (!brandId) {
      return NextResponse.json({ error: 'brandId required' }, { status: 400 });
    }

    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
    });
    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    const alerts = await prisma.driftAlert.findMany({
      where: { brandId, status: 'new' },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ alerts });
  } catch (err) {
    console.error('Failed to fetch drift alerts:', err);
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alertId } = await request.json();
    if (!alertId) {
      return NextResponse.json({ error: 'alertId required' }, { status: 400 });
    }

    // Verify the alert belongs to one of the user's brands
    const alert = await prisma.driftAlert.findUnique({
      where: { id: alertId },
      include: { brand: { select: { userId: true } } },
    });

    if (!alert || alert.brand.userId !== user.id) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    const updated = await prisma.driftAlert.update({
      where: { id: alertId },
      data: { status: 'dismissed' },
    });

    return NextResponse.json({ alert: updated });
  } catch (err) {
    console.error('Failed to dismiss alert:', err);
    return NextResponse.json({ error: 'Failed to dismiss alert' }, { status: 500 });
  }
}
