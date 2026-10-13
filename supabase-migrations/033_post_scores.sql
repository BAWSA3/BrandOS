-- ============================================================================
-- Migration: "PostScore" — per-post brand-fit breakdowns for the dashboard
-- Date: 2026-10-13
--
-- One row per analyzed X post of a signed-in user: the post (excerpt, time,
-- engagement), its brand fit (0-100, judged against their brand from the
-- latest scan) and the breakdown shown in "Recent posts analyzed": voice /
-- format / hook, why it scored that way, what fit, what drifted, and 2-3
-- suggestions. Also feeds the This week tile, avg fit and on-brand-post XP.
--
-- Unique (userId, tweetId): a post is analyzed once (re-runs skip it).
-- RLS on, NO policies; anon/authenticated revoked. Server-only via Prisma
-- (same pattern as 020/022-032).
--
-- Idempotent. Requires 004 ("User"). Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/033_post_scores.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PostScore" (
  "id"         TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"     TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "tweetId"    TEXT NOT NULL CHECK (char_length("tweetId") BETWEEN 1 AND 32),
  "excerpt"    TEXT NOT NULL CHECK (char_length("excerpt") <= 300),
  "postedAt"   TIMESTAMPTZ NOT NULL,
  "likes"      INTEGER NOT NULL DEFAULT 0 CHECK ("likes" >= 0),
  "replies"    INTEGER NOT NULL DEFAULT 0 CHECK ("replies" >= 0),
  "reposts"    INTEGER NOT NULL DEFAULT 0 CHECK ("reposts" >= 0),
  "views"      INTEGER NOT NULL DEFAULT 0 CHECK ("views" >= 0),
  "multiple"   DOUBLE PRECISION,                       -- likes vs their median
  "fit"        INTEGER NOT NULL CHECK ("fit" BETWEEN 0 AND 100),
  "breakdown"  JSONB NOT NULL,                          -- voice/format/hook/why/fits/misses/sharpen
  "analyzedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "PostScore_userId_tweetId_key" ON "PostScore" ("userId", "tweetId");
CREATE INDEX IF NOT EXISTS "PostScore_userId_postedAt_idx" ON "PostScore" ("userId", "postedAt" DESC);

ALTER TABLE public."PostScore" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."PostScore" FROM anon, authenticated;
