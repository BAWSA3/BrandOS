import { createHash } from 'crypto';
import prisma from '@/lib/db';
import { getCurrentUser, type CurrentUser } from '@/lib/auth';
import { isSubscribed } from '@/lib/billing';
import { requestIp } from '@/lib/lookups';
import {
  allowanceFor,
  quotaView,
  utcDay,
  type QuotaView,
  type ScanAllowance,
} from '@/lib/scan-quota-rules';

/**
 * Daily fresh-scan limit (migration 054), server side. Rules in
 * scan-quota-rules.ts. The count lives in the database ("ScanQuota"), not in
 * one server's memory, so it holds across instances.
 *
 * A route takes a scan BEFORE the fresh read (atomic: count + 1 only while
 * under the limit) and gives it back when the read failed or turned out to be
 * cached. Every database error fails open: before 054 is applied, or if the
 * table is unreachable, scans are allowed as they were.
 */

export type ScanSubject = ScanAllowance & { key?: string };

const deviceKey = (headers: Headers): string =>
  'd:' +
  createHash('sha256')
    .update(`scan-quota|${requestIp(headers) ?? 'unknown'}|${headers.get('user-agent') ?? ''}`)
    .digest('hex');

/** Who is scanning and how many they get. Pass `user` when the route already has it. */
export async function scanSubject(
  headers: Headers,
  user?: CurrentUser | null
): Promise<ScanSubject> {
  const u = user === undefined ? await getCurrentUser().catch(() => null) : user;
  const a = allowanceFor({
    signedIn: !!u,
    admin: u?.role === 'admin',
    subscribed: !!u && isSubscribed(u),
  });
  if (a.unlimited) return a;
  return { ...a, key: u ? `u:${u.id}` : deviceKey(headers) };
}

/** Take one scan. False when they're at the limit. */
export async function takeScan(s: ScanSubject, now: Date = new Date()): Promise<boolean> {
  if (s.unlimited || !s.key) return true;
  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "ScanQuota" ("subject", "day", "count")
      VALUES (${s.key}, ${utcDay(now)}::date, 1)
      ON CONFLICT ("subject", "day") DO UPDATE
        SET "count" = "ScanQuota"."count" + 1, "updatedAt" = now()
        WHERE "ScanQuota"."count" < ${s.limit}
      RETURNING "count"`;
    return rows.length > 0;
  } catch (e) {
    console.error('[scan-quota] take failed (allowing):', e);
    return true;
  }
}

/** Give a scan back: the read failed or was served from a cache. */
export async function refundScan(s: ScanSubject, now: Date = new Date()): Promise<void> {
  if (s.unlimited || !s.key) return;
  try {
    await prisma.$executeRaw`
      UPDATE "ScanQuota" SET "count" = GREATEST("count" - 1, 0), "updatedAt" = now()
      WHERE "subject" = ${s.key} AND "day" = ${utcDay(now)}::date`;
  } catch (e) {
    console.error('[scan-quota] refund failed:', e);
  }
}

/** Today's count for the counter and the limit screen. */
export async function quotaFor(s: ScanSubject, now: Date = new Date()): Promise<QuotaView> {
  if (s.unlimited || !s.key) return quotaView(s, 0, now);
  try {
    const row = await prisma.scanQuota.findUnique({
      where: { subject_day: { subject: s.key, day: new Date(`${utcDay(now)}T00:00:00Z`) } },
      select: { count: true },
    });
    return quotaView(s, row?.count ?? 0, now);
  } catch {
    return quotaView(s, 0, now);
  }
}
