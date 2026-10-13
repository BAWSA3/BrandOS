import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { ON_BRAND_FIT, XP_RULES, levelFor, type XPGain } from '@/lib/xp';
import type { ScanSummary } from '@/lib/home-data';

// Server-only (Prisma). XP + daily streak for the signed-in user (tables from
// migration 029). Called once per dashboard render: every award has a dedupe
// key, so refreshes and retries never award twice. A "visit" is a session:
// requests within VISIT_GAP of the last one count as the same visit, so
// "since your last visit" survives a refresh.
//
// If 029 isn't applied yet (e.g. prod before the migration), this returns
// null and the dashboard keeps the XP / streak / alert tiles hidden.

const VISIT_GAP_MS = 30 * 60 * 1000;
const DAY_MS = 86_400_000;

export interface Progress {
  xpTotal: number;
  level: number;
  /** XP earned since the previous visit (shown under the XP bar). */
  gains: XPGain[];
  streakDays: number;
  /** Score change since the previous visit (null when unchanged or first visit). */
  scoreAlert: { delta: number; score: number } | null;
}

/** UTC calendar day, as a Date at 00:00 UTC. */
function utcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

type Award = { kind: keyof typeof XP_RULES; xp: number; dedupeKey: string; label: string };

/** XP for scans: each rescan, plus every score point gained (drops never cost XP). */
function scanAwards(scans: ScanSummary[]): Award[] {
  const out: Award[] = [];
  for (let i = 1; i < scans.length; i++) {
    const s = scans[i];
    out.push({ kind: 'rescan', xp: XP_RULES.rescan, dedupeKey: `scan:${s.id}`, label: 'Rescan' });
    const gain = s.score - scans[i - 1].score;
    if (gain > 0) {
      out.push({
        kind: 'scorePoint',
        xp: gain * XP_RULES.scorePoint,
        dedupeKey: `gain:${s.id}`,
        label: `Brand score +${gain}`,
      });
    }
  }
  return out;
}

/** One chip per kind of gain: two rescans read "Rescan ×2 +60", not two "Rescan" chips. */
function groupGains(events: { xp: number; label: string | null; kind: string }[]): XPGain[] {
  const by = new Map<string, { xp: number; n: number }>();
  for (const e of events) {
    const label = e.label ?? e.kind;
    const g = by.get(label) ?? { xp: 0, n: 0 };
    by.set(label, { xp: g.xp + e.xp, n: g.n + 1 });
  }
  return [...by].map(([label, g]) => ({ label: g.n > 1 ? `${label} ×${g.n}` : label, xp: g.xp }));
}

/** Record this dashboard visit for the user and return their XP + streak. */
export async function recordVisit(
  userId: string,
  scans: ScanSummary[],
  now = new Date(),
  /** Scored posts (migration 033): XP per post, once each. */
  posts: { tweetId: string; fit: number }[] = []
): Promise<Progress | null> {
  try {
    return await prisma.$transaction(async (tx) => {
      const prev = await tx.userProgress.findUnique({ where: { userId } });
      const today = utcDay(now);
      const newVisit =
        !prev?.lastVisitAt || now.getTime() - prev.lastVisitAt.getTime() > VISIT_GAP_MS;
      const prevVisitAt = newVisit ? (prev?.lastVisitAt ?? null) : (prev?.prevVisitAt ?? null);

      // daily streak: consecutive UTC days with a visit
      let streak = prev?.currentStreakDays ?? 0;
      const last = prev?.lastActiveDate ? utcDay(prev.lastActiveDate) : null;
      const firstToday = !last || last.getTime() !== today.getTime();
      if (firstToday) streak = last && today.getTime() - last.getTime() === DAY_MS ? streak + 1 : 1;

      const awards: Award[] = [
        ...scanAwards(scans),
        ...posts.map((p) =>
          p.fit >= ON_BRAND_FIT
            ? {
                kind: 'onBrandPost' as const,
                xp: XP_RULES.onBrandPost,
                dedupeKey: `post:${p.tweetId}`,
                label: 'On-brand post',
              }
            : {
                kind: 'scoredPost' as const,
                xp: XP_RULES.scoredPost,
                dedupeKey: `post:${p.tweetId}`,
                label: 'Post scored',
              }
        ),
      ];
      if (firstToday) {
        awards.push({
          kind: 'dailyVisit',
          xp: XP_RULES.dailyVisit,
          dedupeKey: `visit:${dayKey(today)}`,
          label: 'Daily check-in',
        });
        if (streak > 1) {
          awards.push({
            kind: 'streakDay',
            xp: XP_RULES.streakDay * Math.min(streak, XP_RULES.streakCap),
            dedupeKey: `streak:${dayKey(today)}`,
            label: `${streak}-day streak`,
          });
        }
      }
      await tx.xPEvent.createMany({
        data: awards.map((a) => ({ userId, ...a, createdAt: now })),
        skipDuplicates: true,
      });

      const [sum, recent] = await Promise.all([
        tx.xPEvent.aggregate({ where: { userId }, _sum: { xp: true } }),
        prevVisitAt
          ? tx.xPEvent.findMany({
              where: { userId, createdAt: { gt: prevVisitAt } },
              orderBy: { createdAt: 'asc' },
              select: { xp: true, label: true, kind: true },
              take: 20,
            })
          : Promise.resolve([]),
      ]);
      const xpTotal = sum._sum.xp ?? 0;
      const latest = scans[scans.length - 1];

      await tx.userProgress.upsert({
        where: { userId },
        create: {
          userId,
          xpTotal,
          currentStreakDays: streak,
          longestStreakDays: streak,
          lastActiveDate: today,
          lastVisitAt: now,
          lastSeenScore: latest?.score ?? null,
        },
        update: {
          xpTotal,
          currentStreakDays: streak,
          longestStreakDays: Math.max(prev?.longestStreakDays ?? 0, streak),
          lastActiveDate: today,
          lastVisitAt: now,
          prevVisitAt,
          lastSeenScore: latest?.score ?? prev?.lastSeenScore ?? null,
        },
      });

      // score change since the previous visit: latest scan vs the newest scan before it
      let scoreAlert: Progress['scoreAlert'] = null;
      if (prevVisitAt && latest && latest.scannedAt > prevVisitAt) {
        const before = [...scans].reverse().find((s) => s.scannedAt <= prevVisitAt);
        if (before && before.score !== latest.score) {
          scoreAlert = { delta: latest.score - before.score, score: latest.score };
        }
      }

      return {
        xpTotal,
        level: levelFor(xpTotal).level,
        gains: groupGains(recent),
        streakDays: streak,
        scoreAlert,
      };
    });
  } catch (e) {
    // P2021: table missing (029 not applied on this database yet)
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2021') return null;
    console.error('[progress] recordVisit failed', e);
    return null;
  }
}

/** Read-only level for the title screen (no awards). */
export async function getLevel(userId: string): Promise<number> {
  try {
    const p = await prisma.userProgress.findUnique({
      where: { userId },
      select: { xpTotal: true },
    });
    return levelFor(p?.xpTotal ?? 0).level;
  } catch {
    return 1;
  }
}
