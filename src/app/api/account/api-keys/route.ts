import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getCurrentUser, getCurrentWorkspace } from '@/lib/auth';
import { generateApiKey } from '@/lib/api-auth';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';

// Self-serve API keys for the BrandOS MCP (/connect). A user sees and manages
// only their own keys; the raw key is shown once at creation and only its
// sha256 is stored.

const MAX_ACTIVE_KEYS = 3;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });

  const keys = await prisma.apiKey.findMany({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: 'desc' },
    select: { id: true, prefix: true, name: true, createdAt: true, lastUsedAt: true },
  });
  return NextResponse.json({ keys });
}

async function handlePost(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });

  let name = 'My AI tools';
  try {
    const body = (await request.json()) as { name?: unknown };
    if (typeof body.name === 'string' && body.name.trim()) name = body.name.trim().slice(0, 40);
  } catch {
    // empty body is fine
  }

  const active = await prisma.apiKey.count({ where: { userId: user.id, isActive: true } });
  if (active >= MAX_ACTIVE_KEYS) {
    return NextResponse.json(
      { error: `You can have up to ${MAX_ACTIVE_KEYS} keys. Revoke one first.` },
      { status: 409 }
    );
  }

  const workspace = await getCurrentWorkspace(user);
  const { raw, hash, prefix } = generateApiKey();
  const key = await prisma.apiKey.create({
    data: {
      key: hash,
      prefix,
      name,
      ownerEmail: user.email ?? `${user.id}@users.mybrandos.app`,
      userId: user.id,
      workspaceId: workspace?.id ?? null,
    },
    select: { id: true, prefix: true, name: true, createdAt: true },
  });
  return NextResponse.json({ key: { ...key, raw } }, { status: 201 });
}

async function handleDelete(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });

  const id = request.nextUrl.searchParams.get('id') ?? '';
  const { count } = await prisma.apiKey.updateMany({
    where: { id, userId: user.id, isActive: true },
    data: { isActive: false },
  });
  if (!count) return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  return NextResponse.json({ revoked: true });
}

export const POST = withRateLimit(handlePost, rateLimiters.strict);
export const DELETE = withRateLimit(handleDelete, rateLimiters.strict);
