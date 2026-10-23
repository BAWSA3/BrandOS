-- ============================================================================
-- Migration: "AudienceInteraction" + AccountPost."audienceSyncedAt"
-- Date: 2026-10-23
--
-- Growth dashboard, audience (pivot 2026-10-22): who replies to, reposts and
-- quotes a brand's posts. Public data only (SocialData: conversation search,
-- retweeted_by, quotes) for a brand's best recent posts.
--
-- AudienceInteraction: one row per (account, post, person, kind). The person
--   is stored by public handle + display name + follower count at read time.
-- AccountPost.audienceSyncedAt: when that post's audience was last read, so a
--   post is re-read at most every few days.
--
-- New table + one nullable column: the app works before this is applied (the
-- audience tile shows its "arriving" state).
--
-- RLS on, NO policies; anon/authenticated revoked. Server-only via Prisma.
-- Idempotent. Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/041_audience.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "AudienceInteraction" (
  "accountId"   TEXT NOT NULL REFERENCES "TrackedAccount"("id") ON DELETE CASCADE,
  "tweetId"     TEXT NOT NULL CHECK ("tweetId" ~ '^[0-9]{1,25}$'),
  "handle"      TEXT NOT NULL CHECK ("handle" = lower("handle") AND "handle" ~ '^[a-z0-9_]{1,15}$'),
  "displayHandle" TEXT NOT NULL CHECK (char_length("displayHandle") BETWEEN 1 AND 15),
  "name"        TEXT,
  "followers"   INTEGER NOT NULL DEFAULT 0,
  "kind"        TEXT NOT NULL CHECK ("kind" IN ('reply', 'repost', 'quote')),
  "at"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("accountId", "tweetId", "handle", "kind")
);
CREATE INDEX IF NOT EXISTS "AudienceInteraction_account_at_idx" ON "AudienceInteraction" ("accountId", "at" DESC);

ALTER TABLE "AccountPost" ADD COLUMN IF NOT EXISTS "audienceSyncedAt" TIMESTAMPTZ;

ALTER TABLE public."AudienceInteraction" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."AudienceInteraction" FROM anon, authenticated;
