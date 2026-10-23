import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limit';
import { allowedAvatarUrl } from '@/lib/field/avatar';

/**
 * GET /api/avatar?h=handle → the X profile photo we already have on file for that
 * handle, served from our own origin so the browser can read its pixels (the
 * field dithers members' photos on a canvas; pbs.twimg.com images can't be read
 * cross-origin reliably).
 *
 * Not an open proxy: the caller only names a handle; the image URL always comes
 * from our database (a signed-in user's saved avatar, else the cached X profile)
 * and must be https://pbs.twimg.com/... No SocialData or X API calls.
 */

const HANDLE = /^[A-Za-z0-9_]{1,15}$/;
const MAX_BYTES = 2 * 1024 * 1024;
const LIMIT = { interval: 60 * 1000, maxRequests: 120 };

/** Ask X's CDN for the 400px variant instead of the 48px "_normal" thumbnail. */
const larger = (u: URL) => new URL(u.toString().replace(/_normal(\.[a-z]+)$/i, '_400x400$1'));

async function storedAvatar(handle: string): Promise<URL | null> {
  const user = await prisma.user
    .findFirst({
      where: { xUsername: { equals: handle, mode: 'insensitive' }, NOT: { avatar: null } },
      select: { avatar: true },
    })
    .catch(() => null);
  const fromUser = allowedAvatarUrl(user?.avatar);
  if (fromUser) return fromUser;
  const cached = await prisma.xProfileCache
    .findUnique({ where: { username: handle }, select: { profileData: true } })
    .catch(() => null);
  try {
    const pd = cached?.profileData ? (JSON.parse(cached.profileData) as unknown) : null;
    const img =
      pd && typeof pd === 'object'
        ? (pd as { profile_image_url?: unknown }).profile_image_url
        : null;
    return allowedAvatarUrl(img);
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const rl = checkRateLimit(`avatar:${getClientIdentifier(request)}`, LIMIT);
  if (rl.limited) return new Response('Too many requests', { status: 429 });

  const raw = request.nextUrl.searchParams.get('h') ?? '';
  if (!HANDLE.test(raw)) return new Response('Bad handle', { status: 400 });
  const url = await storedAvatar(raw.toLowerCase());
  if (!url) return new Response('Not found', { status: 404 });

  for (const candidate of [larger(url), url]) {
    try {
      const res = await fetch(candidate, { redirect: 'error', signal: AbortSignal.timeout(5000) });
      const type = res.headers.get('content-type') ?? '';
      if (!res.ok || !/^image\/(jpeg|png|webp|gif)$/.test(type.split(';')[0])) continue;
      const len = Number(res.headers.get('content-length') ?? 0);
      if (len > MAX_BYTES) continue;
      const body = await res.arrayBuffer();
      if (body.byteLength > MAX_BYTES) continue;
      return new Response(body, {
        headers: {
          'Content-Type': type,
          'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch {
      // try the next candidate
    }
  }
  return new Response('Not found', { status: 404 });
}
