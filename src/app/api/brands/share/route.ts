import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// In-memory store for shared brands (for demo - use database in production)
const sharedBrands = new Map<string, {
  brand: unknown;
  createdAt: Date;
  expiresAt?: Date;
}>();

// Create a shareable link for a brand
export async function POST(request: NextRequest) {
  try {
    const { brand, expiresIn } = await request.json();
    
    if (!brand?.name) {
      return NextResponse.json(
        { error: 'Invalid brand data' },
        { status: 400 }
      );
    }

    const shareToken = uuidv4();
    const createdAt = new Date();
    const expiresAt = expiresIn ? new Date(Date.now() + expiresIn) : undefined;

    sharedBrands.set(shareToken, {
      brand,
      createdAt,
      expiresAt,
    });

    const baseUrl = request.headers.get('origin') || '';
    const shareUrl = `${baseUrl}/shared/${shareToken}`;

    return NextResponse.json({
      success: true,
      shareToken,
      shareUrl,
      expiresAt: expiresAt?.toISOString(),
    });
    
  } catch (error) {
    console.error('Share error:', error);
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

    const shared = sharedBrands.get(token);

    if (!shared) {
      return NextResponse.json(
        { error: 'Share link not found or expired' },
        { status: 404 }
      );
    }

    // Check expiration
    if (shared.expiresAt && shared.expiresAt < new Date()) {
      sharedBrands.delete(token);
      return NextResponse.json(
        { error: 'Share link has expired' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      brand: shared.brand,
      createdAt: shared.createdAt.toISOString(),
      expiresAt: shared.expiresAt?.toISOString(),
    });
    
  } catch (error) {
    console.error('Get shared error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve shared brand' },
      { status: 500 }
    );
  }
}

