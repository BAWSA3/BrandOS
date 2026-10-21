import { createHash } from 'node:crypto';
import prisma from '@/lib/db';

/**
 * "Your brand was looked up" (migration 039). Counts and type only: who looked
 * is never shown. Every read/write degrades to "nothing" if the table isn't
 * there yet, so callers never need to guard.
 */

export type LookupKind = 'page' | 'mcp' | 'compare';

export interface LookupStats {
  total: number;
  page: number;
  mcp: number;
  compare: number;
}

const EMPTY: LookupStats = { total: 0, page: 0, mcp: 0, compare: 0 };
const HANDLE_RE = /^[a-z0-9_]{1,20}$/;
const utcDay = (d = new Date()) => d.toISOString().slice(0, 10);

/**
 * Dedupe key for a viewer: the account when signed in, else a salted hash of
 * IP + user agent that rotates daily (never stored in a reversible form).
 */
export function viewerKey(v: {
  userId?: string | null;
  ip?: string | null;
  ua?: string | null;
}): string {
  if (v.userId) return `u:${v.userId}`.slice(0, 80);
  const salt = process.env.LOOKUP_SALT || process.env.INTERNAL_API_SECRET || 'brandos-lookups';
  const h = createHash('sha256')
    .update(`${salt}|${utcDay()}|${v.ip ?? ''}|${v.ua ?? ''}`)
    .digest('hex')
    .slice(0, 32);
  return `v:${h}`;
}

/** The X handle (lowercase) of a BrandOS account, or null. */
async function handleOf(userId: string): Promise<string | null> {
  const x = await prisma.platformConnection
    .findFirst({ where: { userId, platform: 'x' }, select: { platformUsername: true } })
    .catch(() => null);
  return x?.platformUsername?.toLowerCase() ?? null;
}

/**
 * Record one lookup of `handle`. Skips the owner looking at themselves and
 * repeat lookups by the same viewer on the same day (unique key). Never throws.
 */
export async function recordLookup(input: {
  handle: string;
  kind: LookupKind;
  viewerUserId?: string | null;
  ip?: string | null;
  ua?: string | null;
}): Promise<void> {
  try {
    const handle = input.handle.replace(/^@/, '').toLowerCase();
    if (!HANDLE_RE.test(handle)) return;
    if (input.viewerUserId && (await handleOf(input.viewerUserId)) === handle) return;
    await prisma.brandLookup.createMany({
      data: [
        {
          handle,
          kind: input.kind,
          viewerKey: viewerKey({ userId: input.viewerUserId, ip: input.ip, ua: input.ua }),
        },
      ],
      skipDuplicates: true,
    });
  } catch {
    // table not there yet, or a transient error: lookups are best-effort
  }
}

/** Lookup counts for a handle since a date. */
export async function lookupStats(handle: string, since: Date): Promise<LookupStats> {
  try {
    const rows = await prisma.brandLookup.groupBy({
      by: ['kind'],
      where: { handle: handle.replace(/^@/, '').toLowerCase(), createdAt: { gte: since } },
      _count: { _all: true },
    });
    const out: LookupStats = { ...EMPTY };
    for (const r of rows) {
      const k = r.kind as LookupKind;
      if (k in out) out[k] = r._count._all;
      out.total += r._count._all;
    }
    return out;
  } catch {
    return { ...EMPTY };
  }
}

/** Client IP from the usual proxy headers (Vercel sets x-forwarded-for). */
export function requestIp(headers: Headers): string | null {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || null;
}
