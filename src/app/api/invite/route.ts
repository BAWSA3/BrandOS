import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import prisma from '@/lib/db';
import { checkRateLimit, getClientIdentifier, rateLimiters } from '@/lib/rate-limit';

// Generate a 6-character invite code using cryptographically secure random
function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // exclude confusing chars (O, 0, I, 1, L)
  const bytes = randomBytes(6);
  return Array.from(bytes, (byte) =>
    chars[byte % chars.length]
  ).join('');
}

// GET /api/invite?code=XXX - Validate an invite code
export async function GET(request: NextRequest) {
  try {
    // Strict rate limiting: 5 requests per minute to prevent brute force
    const clientId = getClientIdentifier(request);
    const { limited, resetIn } = checkRateLimit(clientId + ':invite', rateLimiters.strict);

    if (limited) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': Math.ceil(resetIn / 1000).toString() },
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');

    if (!code) {
      return NextResponse.json(
        { error: 'Code parameter is required' },
        { status: 400 }
      );
    }

    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!inviteCode) {
      return NextResponse.json(
        { valid: false, error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    // Check if code is expired
    if (inviteCode.expiresAt && new Date() > inviteCode.expiresAt) {
      return NextResponse.json(
        { valid: false, error: 'Invite code has expired' },
        { status: 410 }
      );
    }

    // Check if code is still active
    if (!inviteCode.isActive) {
      return NextResponse.json(
        { valid: false, error: 'Invite code is no longer active' },
        { status: 410 }
      );
    }

    // Check if code has remaining uses
    if (inviteCode.usedCount >= inviteCode.maxUses) {
      return NextResponse.json(
        { valid: false, error: 'Invite code has reached maximum uses' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      valid: true,
      createdBy: inviteCode.createdBy,
      remainingUses: inviteCode.maxUses - inviteCode.usedCount,
    });
  } catch (error) {
    console.error('[Invite] Validation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/invite - Generate invite codes for a username
const MAX_CODES_PER_USER = 3;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, count = 3 } = body;

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    // Check how many codes this user has already generated
    const existingCodes = await prisma.inviteCode.findMany({
      where: { createdBy: username },
    });

    const existingCount = existingCodes.length;
    const remainingAllowance = MAX_CODES_PER_USER - existingCount;

    // If user already has max codes, return their existing codes
    if (remainingAllowance <= 0) {
      return NextResponse.json({
        success: true,
        codes: existingCodes.map(c => ({
          code: c.code,
          maxUses: c.maxUses,
          usedCount: c.usedCount,
          createdAt: c.createdAt,
        })),
        message: `You already have ${MAX_CODES_PER_USER} invite codes`,
      });
    }

    // Limit codes to remaining allowance
    const codeCount = Math.min(Math.max(1, count), remainingAllowance);

    // Generate unique codes
    const codes = [];
    for (let i = 0; i < codeCount; i++) {
      let code: string;
      let attempts = 0;

      // Try to generate a unique code (with retry logic)
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
          maxUses: 1,
          usedCount: 0,
          usedBy: '[]',
          isActive: true,
        },
      });

      codes.push({
        code: inviteCode.code,
        maxUses: inviteCode.maxUses,
        usedCount: inviteCode.usedCount,
        createdAt: inviteCode.createdAt,
      });
    }

    return NextResponse.json({
      success: true,
      codes,
    }, { status: 201 });
  } catch (error: unknown) {
    const prismaCode = error && typeof error === 'object' && 'code' in error ? (error as { code: string }).code : undefined;
    if (prismaCode === 'P2021') {
      console.error('[Invite] Generation error: InviteCode table does not exist. Run `npx prisma db push` to create it.');
    } else if (prismaCode === 'P1001') {
      console.error('[Invite] Generation error: Cannot reach database server. Check DATABASE_URL and ensure the database is running.');
    } else {
      console.error('[Invite] Generation error:', error);
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/invite - Redeem an invite code
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, username } = body;

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    if (!username || typeof username !== 'string') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const inviteCode = await prisma.inviteCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!inviteCode) {
      return NextResponse.json(
        { success: false, error: 'Invalid invite code' },
        { status: 404 }
      );
    }

    // Check if code is expired
    if (inviteCode.expiresAt && new Date() > inviteCode.expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Invite code has expired' },
        { status: 410 }
      );
    }

    // Check if code is still active
    if (!inviteCode.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invite code is no longer active' },
        { status: 410 }
      );
    }

    // Check if code has remaining uses
    if (inviteCode.usedCount >= inviteCode.maxUses) {
      return NextResponse.json(
        { success: false, error: 'Invite code has reached maximum uses' },
        { status: 410 }
      );
    }

    // Parse existing usedBy array
    const usedBy: string[] = JSON.parse(inviteCode.usedBy);

    // Check if user already used this code
    if (usedBy.includes(username)) {
      return NextResponse.json(
        { success: false, error: 'You have already used this invite code' },
        { status: 409 }
      );
    }

    // Update the invite code
    usedBy.push(username);
    const updatedCode = await prisma.inviteCode.update({
      where: { code: code.toUpperCase() },
      data: {
        usedCount: inviteCode.usedCount + 1,
        usedBy: JSON.stringify(usedBy),
        // Deactivate if max uses reached
        isActive: inviteCode.usedCount + 1 < inviteCode.maxUses,
      },
    });

    return NextResponse.json({
      success: true,
      referredBy: inviteCode.createdBy,
      remainingUses: updatedCode.maxUses - updatedCode.usedCount,
    });
  } catch (error) {
    console.error('[Invite] Redemption error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
