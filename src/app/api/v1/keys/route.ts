import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { generateApiKey, hashApiKey, API_CORS_HEADERS } from '@/lib/api-auth';
import type { ApiKeyTier } from '@prisma/client';

// =============================================================================
// API Key Management (Admin only — protected by ADMIN_SECRET)
// =============================================================================
//
// POST /api/v1/keys — Create a new API key
// GET  /api/v1/keys — List all API keys (no secrets shown)
// =============================================================================

function authenticateAdmin(request: NextRequest): boolean {
  const secret = request.headers.get('x-admin-secret');
  const adminSecret = process.env.ADMIN_SECRET;
  return !!adminSecret && secret === adminSecret;
}

/** POST — Create a new API key */
export async function POST(request: NextRequest) {
  if (!authenticateAdmin(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: API_CORS_HEADERS }
    );
  }

  let name: string;
  let ownerEmail: string;
  let tier: ApiKeyTier = 'FREE';
  let dailyLimit: number | undefined;
  let minuteLimit: number | undefined;
  let metadata: string | undefined;
  let expiresAt: string | undefined;

  try {
    const body = await request.json();
    name = body.name;
    ownerEmail = body.ownerEmail;
    tier = body.tier || 'FREE';
    dailyLimit = body.dailyLimit;
    minuteLimit = body.minuteLimit;
    metadata = body.metadata ? JSON.stringify(body.metadata) : undefined;
    expiresAt = body.expiresAt;
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: API_CORS_HEADERS }
    );
  }

  if (!name || !ownerEmail) {
    return NextResponse.json(
      { error: 'Required fields: name, ownerEmail' },
      { status: 400, headers: API_CORS_HEADERS }
    );
  }

  const { raw, hash, prefix } = generateApiKey();

  try {
    const apiKey = await prisma.apiKey.create({
      data: {
        key: hash,
        prefix,
        name,
        ownerEmail,
        tier,
        dailyLimit,
        minuteLimit,
        metadata,
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      },
    });

    return NextResponse.json(
      {
        success: true,
        apiKey: {
          id: apiKey.id,
          key: raw, // Only shown ONCE at creation time
          prefix: apiKey.prefix,
          name: apiKey.name,
          ownerEmail: apiKey.ownerEmail,
          tier: apiKey.tier,
          dailyLimit: apiKey.dailyLimit,
          minuteLimit: apiKey.minuteLimit,
          createdAt: apiKey.createdAt.toISOString(),
        },
        warning: 'Save this API key now — it will not be shown again.',
      },
      { status: 201, headers: API_CORS_HEADERS }
    );
  } catch (err) {
    console.error('[API Keys] Create failed:', err);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500, headers: API_CORS_HEADERS }
    );
  }
}

/** GET — List all API keys (no secrets) */
export async function GET(request: NextRequest) {
  if (!authenticateAdmin(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: API_CORS_HEADERS }
    );
  }

  try {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        prefix: true,
        name: true,
        ownerEmail: true,
        tier: true,
        isActive: true,
        requestsToday: true,
        requestsTotal: true,
        lastUsedAt: true,
        dailyLimit: true,
        minuteLimit: true,
        expiresAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, keys, total: keys.length },
      { headers: API_CORS_HEADERS }
    );
  } catch (err) {
    console.error('[API Keys] List failed:', err);
    return NextResponse.json(
      { error: 'Failed to list API keys' },
      { status: 500, headers: API_CORS_HEADERS }
    );
  }
}
