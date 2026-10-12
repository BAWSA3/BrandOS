-- ============================================================================
-- Migration: XP + streaks (the dashboard XP bar, "This week" tile and
-- "since your last visit" alert, which are hidden until this data exists)
-- Date: 2026-10-11
--
-- "XPEvent": an append-only ledger, one row per thing that earned XP (rules in
-- src/lib/xp.ts). "dedupeKey" makes each award idempotent per user, e.g.
--   visit:2026-10-11   scan:<BrandScan.id>   floor:2   post:<tweetId>
-- so a retried request or double render can never award the same XP twice.
--
-- "UserProgress": one row per user, the running totals the dashboard reads
-- (so it never sums the ledger on page load):
--   xpTotal                      sum of XPEvent.xp (kept in step by the server
--                                in the same transaction as the insert)
--   currentStreakDays / longest  consecutive days with a dashboard visit
--   lastActiveDate               the user's last visit day (their local date)
--   lastVisitAt / prevVisitAt    "since your last visit": score change and XP
--                                earned since prevVisitAt
--   lastSeenScore                score shown on the last visit (score alert)
--   weeklyGoal                   on-brand posts per week (default 3)
--   streakWeeks / lastGoalWeek   consecutive weeks the goal was met; Monday of
--                                the last week that met it
--
-- RLS on, NO policies; anon/authenticated revoked. Server routes only, via the
-- service-role Prisma client (same pattern as 020/022-027).
--
-- Idempotent. Requires 004 ("User"). Numbered 029 because 028 is taken by the
-- studio shell (PR #59). Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/029_xp_and_streaks.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "XPEvent" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "kind"      TEXT NOT NULL CHECK ("kind" IN (
                'dailyVisit', 'streakDay', 'scorePoint', 'rescan',
                'floorBuilt', 'task', 'onBrandPost', 'scoredPost'
              )),
  "xp"        INTEGER NOT NULL CHECK ("xp" > 0 AND "xp" <= 5000),
  "dedupeKey" TEXT NOT NULL CHECK (char_length("dedupeKey") BETWEEN 1 AND 200),
  "label"     TEXT CHECK ("label" IS NULL OR char_length("label") <= 120),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "XPEvent_userId_dedupeKey_key"
  ON "XPEvent" ("userId", "dedupeKey");
CREATE INDEX IF NOT EXISTS "XPEvent_userId_createdAt_idx"
  ON "XPEvent" ("userId", "createdAt" DESC);

CREATE TABLE IF NOT EXISTS "UserProgress" (
  "userId"            TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
  "xpTotal"           INTEGER NOT NULL DEFAULT 0 CHECK ("xpTotal" >= 0),
  "currentStreakDays" INTEGER NOT NULL DEFAULT 0 CHECK ("currentStreakDays" >= 0),
  "longestStreakDays" INTEGER NOT NULL DEFAULT 0 CHECK ("longestStreakDays" >= 0),
  "lastActiveDate"    DATE,
  "lastVisitAt"       TIMESTAMPTZ,
  "prevVisitAt"       TIMESTAMPTZ,
  "lastSeenScore"     INTEGER CHECK ("lastSeenScore" IS NULL OR "lastSeenScore" BETWEEN 0 AND 100),
  "weeklyGoal"        INTEGER NOT NULL DEFAULT 3 CHECK ("weeklyGoal" BETWEEN 1 AND 14),
  "streakWeeks"       INTEGER NOT NULL DEFAULT 0 CHECK ("streakWeeks" >= 0),
  "lastGoalWeek"      DATE,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public."XPEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserProgress" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."XPEvent" FROM anon, authenticated;
REVOKE ALL ON TABLE public."UserProgress" FROM anon, authenticated;
