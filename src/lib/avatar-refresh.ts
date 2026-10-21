import prisma from '@/lib/db';
import { fetchProfile } from '@/lib/socialdata';

/**
 * Keeps a user's stored X photo (User.avatar: Brand Pass, dashboard, MCP)
 * current. X has no affordable "photo changed" webhook, so three triggers:
 *   1. a rescan saves the photo from the X profile it just read (free)
 *   2. the Brand Pass asks for a refresh when the stored photo fails to load
 *      (X removes old images after a change) — /api/me/avatar
 *   3. the first dashboard visit each day checks in the background
 * The last check time lives in the X PlatformConnection's profileData JSON
 * (no migration). Server-only.
 */

const DAY_MS = 86_400_000;
const PBS = /^https:\/\/pbs\.twimg\.com\/profile_images\//;

/** X's 48px "_normal" -> the 400px image. */
export const hiRes = (url: string) => url.replace(/_normal(\.\w+)$/, '_400x400$1');

/** Save a photo URL we already have (e.g. from a scan). Returns the stored URL. */
export async function saveAvatar(userId: string, url: string | null | undefined) {
  if (!url || !PBS.test(url)) return null;
  const next = hiRes(url);
  await prisma.user
    .updateMany({ where: { id: userId, NOT: { avatar: next } }, data: { avatar: next } })
    .catch((e) => console.error('[avatar] save failed:', e));
  return next;
}

function parseData(raw: string | null): Record<string, unknown> {
  try {
    const v = raw ? JSON.parse(raw) : {};
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * Look the user's X profile up and save its photo. `minAgeMs` throttles
 * (0 = always). Returns the current photo URL, or null if unknown.
 */
export async function refreshAvatar(userId: string, minAgeMs = DAY_MS): Promise<string | null> {
  const x = await prisma.platformConnection
    .findFirst({
      where: { userId, platform: 'x', status: 'active' },
      select: { id: true, platformUsername: true, profileData: true },
    })
    .catch(() => null);
  if (!x) return null;
  const data = parseData(x.profileData);
  const last = typeof data.avatarCheckedAt === 'string' ? Date.parse(data.avatarCheckedAt) : 0;
  if (minAgeMs > 0 && Date.now() - last < minAgeMs) return null;

  // mark first, so concurrent visits don't all call X
  await prisma.platformConnection
    .update({
      where: { id: x.id },
      data: { profileData: JSON.stringify({ ...data, avatarCheckedAt: new Date().toISOString() }) },
    })
    .catch(() => null);

  const { profile } = await fetchProfile(x.platformUsername);
  return saveAvatar(userId, profile?.profile_image_url);
}
