import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// Simple admin key check - same pattern as signups
const ADMIN_KEY = process.env.ADMIN_API_KEY;

function isAuthorized(request: NextRequest): boolean {
  // In development, allow access
  if (process.env.NODE_ENV === 'development') return true;

  // In production, require API key
  const authHeader = request.headers.get('authorization');
  const apiKey = authHeader?.replace('Bearer ', '');
  return apiKey === ADMIN_KEY && !!ADMIN_KEY;
}

// Generate a 6-character invite code
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

// GET /api/admin/invites - List all invite codes with stats
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const inviteCodes = await prisma.inviteCode.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Calculate stats
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const totalCodes = inviteCodes.length;
    const activeCodes = inviteCodes.filter(c => c.isActive && c.usedCount < c.maxUses).length;
    const totalRedemptions = inviteCodes.reduce((sum, c) => sum + c.usedCount, 0);
    const codesCreatedToday = inviteCodes.filter(c => c.createdAt >= todayStart).length;

    // Format codes for response
    const codes = inviteCodes.map(c => ({
      id: c.id,
      code: c.code,
      createdBy: c.createdBy,
      maxUses: c.maxUses,
      usedCount: c.usedCount,
      usedBy: JSON.parse(c.usedBy) as string[],
      isActive: c.isActive,
      expiresAt: c.expiresAt,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({
      stats: {
        totalCodes,
        activeCodes,
        totalRedemptions,
        codesCreatedToday,
      },
      codes,
    });
  } catch (error) {
    console.error('[Admin/Invites] GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invite codes' },
      { status: 500 }
    );
  }
}

// POST /api/admin/invites - Generate codes for any username (admin override)
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { username, count = 3, maxUses = 3, expiresAt } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Validate count (1-10)
    const codeCount = Math.min(Math.max(1, count), 10);

    // Validate maxUses (1-100)
    const maxUsesPerCode = Math.min(Math.max(1, maxUses), 100);

    // Parse expiry date if provided
    let expiryDate: Date | null = null;
    if (expiresAt) {
      expiryDate = new Date(expiresAt);
      if (isNaN(expiryDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid expiry date' },
          { status: 400 }
        );
      }
    }

    // Generate unique codes
    const codes = [];
    for (let i = 0; i < codeCount; i++) {
      let code: string;
      let attempts = 0;

      // Try to generate a unique code
      do {
        code = generateCode();
        attempts++;
        if (attempts > 10) {
          return NextResponse.json(
            { error: 'Failed to generate unique codes' },
            { status: 500 }
          );
        }
      } while (await prisma.inviteCode.findUnique({ where: { code } }));

      // Create the invite code
      const inviteCode = await prisma.inviteCode.create({
        data: {
          code,
          createdBy: username,
          maxUses: maxUsesPerCode,
          usedCount: 0,
          usedBy: '[]',
          isActive: true,
          expiresAt: expiryDate,
        },
      });

      codes.push({
        id: inviteCode.id,
        code: inviteCode.code,
        createdBy: inviteCode.createdBy,
        maxUses: inviteCode.maxUses,
        usedCount: inviteCode.usedCount,
        usedBy: [] as string[],
        isActive: inviteCode.isActive,
        expiresAt: inviteCode.expiresAt,
        createdAt: inviteCode.createdAt,
      });
    }

    return NextResponse.json({
      success: true,
      codes,
    }, { status: 201 });
  } catch (error) {
    console.error('[Admin/Invites] POST error:', error);
    return NextResponse.json(
      { error: 'Failed to generate codes' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/invites - Update code (deactivate/reactivate, change maxUses)
export async function PATCH(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, isActive, maxUses } = body;

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Code ID is required' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: { isActive?: boolean; maxUses?: number } = {};

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }

    if (typeof maxUses === 'number' && maxUses >= 1 && maxUses <= 100) {
      updateData.maxUses = maxUses;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid update fields provided' },
        { status: 400 }
      );
    }

    const updatedCode = await prisma.inviteCode.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      code: {
        id: updatedCode.id,
        code: updatedCode.code,
        createdBy: updatedCode.createdBy,
        maxUses: updatedCode.maxUses,
        usedCount: updatedCode.usedCount,
        usedBy: JSON.parse(updatedCode.usedBy) as string[],
        isActive: updatedCode.isActive,
        expiresAt: updatedCode.expiresAt,
        createdAt: updatedCode.createdAt,
      },
    });
  } catch (error) {
    console.error('[Admin/Invites] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update code' },
      { status: 500 }
    );
  }
}
