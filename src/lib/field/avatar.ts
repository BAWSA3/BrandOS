/** Avatar URLs the field may load through /api/avatar: X's image CDN only. */

/** Only X's image CDN, over https, with no credentials or odd ports. */
export function allowedAvatarUrl(raw: unknown): URL | null {
  if (typeof raw !== 'string') return null;
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' || u.hostname !== 'pbs.twimg.com') return null;
    if (u.port || u.username || u.password) return null;
    return u;
  } catch {
    return null;
  }
}

/** Same-origin URL for a member's photo (the field reads its pixels). */
export const avatarSrc = (handle: string) => `/api/avatar?h=${encodeURIComponent(handle)}`;
