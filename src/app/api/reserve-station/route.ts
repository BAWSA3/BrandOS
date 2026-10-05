import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { botGuard } from '@/lib/botid-guard';
import { withRateLimit, rateLimiters } from '@/lib/rate-limit';
import { normalizeArchetypeName } from '@/lib/archetype-names';

/**
 * POST /api/reserve-station — "Reserve your brand station" after a scan.
 *
 * Adds the email to the existing EmailSignup list, or marks an existing row as
 * reserved (keeping its original `source`). Nothing is emailed yet. Public, so:
 * BotID + 5/min per IP, strict input validation, service-role write via Prisma.
 *
 * The reserved station is LOCKED: the archetype comes from our own record of
 * the handle's latest scan (falling back to the client value only when there
 * is no scan), and is written only the first time. Whatever station someone
 * reserves is the one they get when the studio opens.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HANDLE_RE = /^[A-Za-z0-9_]{1,30}$/;
const ARCHETYPES = new Set([
  'SOURCE',
  'RELAY',
  'FREQ',
  'FORESIGHT',
  'BUILD.EXE',
  'ARC',
  'ENTROPY',
  'NULL',
]);

async function handlePost(request: NextRequest) {
  const botBlock = await botGuard(request);
  if (botBlock) return botBlock;

  let body: { email?: unknown; username?: unknown; archetype?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email' }, { status: 400 });
  }
  const rawHandle = typeof body.username === 'string' ? body.username.replace(/^@/, '') : '';
  const handle = HANDLE_RE.test(rawHandle) ? rawHandle.toLowerCase() : null;
  const rawArchetype = typeof body.archetype === 'string' ? body.archetype.toUpperCase() : '';
  const clientArchetype = ARCHETYPES.has(rawArchetype) ? rawArchetype : null;

  try {
    // Prefer the server's record of this handle's latest scan over the
    // client-supplied value, so a station can't be picked by editing the request.
    let archetype = clientArchetype;
    if (handle) {
      const scan = await prisma.brandScans.findFirst({
        where: { username: { equals: handle, mode: 'insensitive' } },
        orderBy: { createdAt: 'desc' },
        select: { archetype: true },
      });
      const scanned = scan?.archetype ? normalizeArchetypeName(scan.archetype).toUpperCase() : '';
      if (ARCHETYPES.has(scanned)) archetype = scanned;
    }

    const existing = await prisma.emailSignup.findUnique({
      where: { email },
      select: { id: true, xUsername: true, reservedAt: true, reservedArchetype: true },
    });

    if (existing) {
      await prisma.emailSignup.update({
        where: { id: existing.id },
        data: {
          reservedAt: existing.reservedAt ?? new Date(),
          // Locked on first reservation; later scans never change it.
          reservedArchetype: existing.reservedArchetype ?? archetype ?? undefined,
          xUsername: existing.xUsername ?? handle ?? undefined,
          // Unsubscribe status is deliberately untouched: anyone can type any
          // email here, so reserving must never re-subscribe someone who left.
        },
      });
    } else {
      await prisma.emailSignup.create({
        data: {
          email,
          xUsername: handle,
          source: 'reserve-station',
          reservedAt: new Date(),
          reservedArchetype: archetype,
        },
      });
    }

    const position = await prisma.emailSignup.count({ where: { reservedAt: { not: null } } });
    // Same response for new and existing emails, so this can't be used to
    // check whether an address is on the list.
    return NextResponse.json({ reserved: true, position });
  } catch (error) {
    console.error('[reserve-station] Failed:', error);
    return NextResponse.json({ error: 'Could not reserve right now' }, { status: 500 });
  }
}

export const POST = withRateLimit(handlePost, rateLimiters.strict);
