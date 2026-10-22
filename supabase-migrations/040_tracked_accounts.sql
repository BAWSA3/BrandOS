-- ============================================================================
-- Migration: "TrackedAccount" + "AccountSnapshot" + "AccountPost"
-- Date: 2026-10-22
--
-- The growth dashboard (pivot decided 2026-10-22, docs/LAUNCH-PLAN.md): a
-- workspace tracks X accounts by public handle — its own brands (creators or
-- company accounts, for SMMs/agencies) and up to 5 competitors per brand.
--
-- TrackedAccount: one row per handle a workspace follows. competitorOfId set =
--   a competitor of that brand (same pipeline, not counted as a brand).
-- AccountSnapshot: one row per account per UTC day — profile counts plus the
--   stats of their recent original posts (src/lib/tweet-analysis.ts). Follower
--   history only exists from the day an account is added (X has no public
--   history).
-- AccountPost: their recent original posts with the latest metrics, upserted on
--   every sync — powers "what's working" and best/worst posts.
--
-- Separate tables (nothing existing changes): the app works before this is
-- applied (the dashboard falls back to the current single-account view).
--
-- RLS on, NO policies; anon/authenticated revoked. Server-only via Prisma.
-- Idempotent. Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/040_tracked_accounts.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "TrackedAccount" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "workspaceId"    UUID NOT NULL REFERENCES "Workspace"("id") ON DELETE CASCADE,
  "handle"         TEXT NOT NULL CHECK ("handle" = lower("handle") AND "handle" ~ '^[a-z0-9_]{1,15}$'),
  "displayHandle"  TEXT NOT NULL CHECK (char_length("displayHandle") BETWEEN 1 AND 15),
  "xUserId"        TEXT,
  "kind"           TEXT NOT NULL DEFAULT 'creator' CHECK ("kind" IN ('creator', 'brand')),
  "competitorOfId" TEXT REFERENCES "TrackedAccount"("id") ON DELETE CASCADE,
  "addedByUserId"  TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "lastSyncedAt"   TIMESTAMPTZ,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- a handle is tracked once per workspace as a brand, and once per brand as a competitor
CREATE UNIQUE INDEX IF NOT EXISTS "TrackedAccount_brand_uniq"
  ON "TrackedAccount" ("workspaceId", "handle") WHERE "competitorOfId" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "TrackedAccount_competitor_uniq"
  ON "TrackedAccount" ("competitorOfId", "handle") WHERE "competitorOfId" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "TrackedAccount_workspace_idx" ON "TrackedAccount" ("workspaceId");
CREATE INDEX IF NOT EXISTS "TrackedAccount_lastSyncedAt_idx" ON "TrackedAccount" ("lastSyncedAt");

CREATE TABLE IF NOT EXISTS "AccountSnapshot" (
  "accountId"      TEXT NOT NULL REFERENCES "TrackedAccount"("id") ON DELETE CASCADE,
  "day"            DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  "followers"      INTEGER NOT NULL,
  "following"      INTEGER NOT NULL,
  "postsTotal"     INTEGER NOT NULL,
  "listed"         INTEGER NOT NULL DEFAULT 0,
  "samplePosts"    INTEGER NOT NULL DEFAULT 0,
  "sampleDays"     REAL NOT NULL DEFAULT 0,
  "postsPerDay"    REAL NOT NULL DEFAULT 0,
  "engagementRate" REAL,
  "mediaShare"     REAL NOT NULL DEFAULT 0,
  "avgLikes"       REAL NOT NULL DEFAULT 0,
  "avgReplies"     REAL NOT NULL DEFAULT 0,
  "avgReposts"     REAL NOT NULL DEFAULT 0,
  "avgViews"       REAL NOT NULL DEFAULT 0,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("accountId", "day")
);

CREATE TABLE IF NOT EXISTS "AccountPost" (
  "accountId" TEXT NOT NULL REFERENCES "TrackedAccount"("id") ON DELETE CASCADE,
  "tweetId"   TEXT NOT NULL CHECK ("tweetId" ~ '^[0-9]{1,25}$'),
  "text"      TEXT NOT NULL,
  "postedAt"  TIMESTAMPTZ NOT NULL,
  "likes"     INTEGER NOT NULL DEFAULT 0,
  "replies"   INTEGER NOT NULL DEFAULT 0,
  "reposts"   INTEGER NOT NULL DEFAULT 0,
  "quotes"    INTEGER NOT NULL DEFAULT 0,
  "bookmarks" INTEGER NOT NULL DEFAULT 0,
  "views"     INTEGER NOT NULL DEFAULT 0,
  "media"     TEXT[] NOT NULL DEFAULT '{}',
  "isQuote"   BOOLEAN NOT NULL DEFAULT false,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("accountId", "tweetId")
);
CREATE INDEX IF NOT EXISTS "AccountPost_account_postedAt_idx" ON "AccountPost" ("accountId", "postedAt" DESC);

ALTER TABLE public."TrackedAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AccountSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."AccountPost" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."TrackedAccount" FROM anon, authenticated;
REVOKE ALL ON TABLE public."AccountSnapshot" FROM anon, authenticated;
REVOKE ALL ON TABLE public."AccountPost" FROM anon, authenticated;
