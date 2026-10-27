import { timingSafeEqual } from 'crypto';
import { getCurrentUser } from '@/lib/auth';

/** `Authorization: Bearer <ADMIN_API_KEY>`, constant-time; false when the key is unset. */
function hasAdminKey(request: Request): boolean {
  const key = process.env.ADMIN_API_KEY;
  if (!key) return false;
  const given = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  const a = Buffer.from(given);
  const b = Buffer.from(key);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Admin-only API auth: a signed-in account with role "admin" (the
 * /dashboard/inbox page), or the ADMIN_API_KEY bearer (scripts). Server-only.
 */
export async function isAdminRequest(request: Request): Promise<boolean> {
  if (hasAdminKey(request)) return true;
  const user = await getCurrentUser().catch(() => null);
  return user?.role === 'admin';
}
