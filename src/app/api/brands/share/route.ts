import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
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

// Create a shareable link for a brand
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    const { brandId, brand: brandData } = await request.json();

    // If user is authenticated and provides brandId, update the existing brand
    if (user && brandId) {
      // Verify ownership
      const existingBrand = await prisma.brand.findFirst({
        where: { id: brandId, userId: user.id },
      });

      if (!existingBrand) {
        return NextResponse.json(
          { error: 'Brand not found' },
          { status: 404 }
        );
      }

      // Generate share token if not already set
      const shareToken = existingBrand.shareToken || uuidv4();

      // Update brand with share token and make it public
      await prisma.brand.update({
        where: { id: brandId },
        data: {
          shareToken,
          isPublic: true,
        },
      });

      const baseUrl = request.headers.get('origin') || '';
      const shareUrl = `${baseUrl}/shared/${shareToken}`;

      return NextResponse.json({
        success: true,
        shareToken,
        shareUrl,
      });
    }

    // For unauthenticated users or when brandData is provided (guest sharing)
    // Create a temporary brand for sharing
    if (!brandData?.name) {
      return NextResponse.json(
        { error: 'Invalid brand data' },
        { status: 400 }
      );
    }

    const shareToken = uuidv4();

    // Create a brand with the share token (no user association for guest shares)
    // We'll need a special "guest" user or handle this differently
    // For now, store in database with a placeholder approach using the brand table
    // This requires the brand to have an owner, so we'll use a different approach

    // Alternative: Create a separate SharedBrandSnapshot table for guest shares
    // For simplicity, we'll keep guest shares working via the existing brand schema
    // by requiring authentication for persistence

    // Return error for unauthenticated share attempts
    return NextResponse.json(
      { error: 'Authentication required to create shareable links. Sign in to share your brand.' },
      { status: 401 }
    );

  } catch (error) {
    console.error('[Share API] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create share link' },
      { status: 500 }
    );
  }
}

// Get a shared brand by token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token required' },
        { status: 400 }
      );
    }

    // Look up brand by share token
    const brand = await prisma.brand.findUnique({
      where: { shareToken: token },
    });

    if (!brand) {
      return NextResponse.json(
        { error: 'Share link not found or expired' },
        { status: 404 }
      );
    }

    // Check if brand is public
    if (!brand.isPublic) {
      return NextResponse.json(
        { error: 'This brand is no longer shared' },
        { status: 403 }
      );
    }

    // Parse JSON fields and return brand data
    const brandData = {
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
    };

    return NextResponse.json({
      success: true,
      brand: brandData,
      createdAt: brand.createdAt.toISOString(),
    });

  } catch (error) {
    console.error('[Share API] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve shared brand' },
      { status: 500 }
    );
  }
}

// DELETE - Revoke share link
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return NextResponse.json({ error: 'Brand ID required' }, { status: 400 });
    }

    // Verify ownership
    const brand = await prisma.brand.findFirst({
      where: { id: brandId, userId: user.id },
    });

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    // Remove share token and make private
    await prisma.brand.update({
      where: { id: brandId },
      data: {
        shareToken: null,
        isPublic: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Share API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to revoke share link' },
      { status: 500 }
    );
  }
}
