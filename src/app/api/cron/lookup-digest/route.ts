import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { lookupStats } from '@/lib/lookups';
import { sendLookupDigest } from '@/lib/lookup-digest';

/**
 * Weekly, Monday (vercel.json): "your brand was looked up N times this week"
 * to every account with an email, an X handle and at least one lookup.
 * Idempotent per user per week (LookupDigest).
 */
export const maxDuration = 300;
const BUDGET_MS = 270_000;

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const started = Date.now();
  const now = new Date();
  const since = new Date(now.getTime() - 7 * 86_400_000);
  // the week key: this Monday (UTC)
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const week = new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 86_400_000);

  const users = await prisma.user.findMany({
    where: { email: { not: null }, platformConnections: { some: { platform: 'x' } } },
    select: {
      id: true,
      email: true,
      platformConnections: {
        where: { platform: 'x' },
        select: { platformUsername: true },
        take: 1,
      },
    },
  });

  const tally = { sent: 0, skipped: 0, already: 0, failed: 0 };
  for (const u of users) {
    if (Date.now() - started > BUDGET_MS) break;
    const handle = u.platformConnections[0]?.platformUsername;
    if (!u.email || !handle) continue;
    const stats = await lookupStats(handle, since);
    const r = await sendLookupDigest({ id: u.id, email: u.email, handle }, stats, week);
    tally[r]++;
  }
  return NextResponse.json({ users: users.length, ...tally });
}
