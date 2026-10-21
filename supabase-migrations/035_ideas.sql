-- ============================================================================
-- Migration: "Idea" — the studio idea board (brainstorm from "Next time")
-- Date: 2026-10-14
--
-- From a post's breakdown, "Build on this" opens the 3D studio room, where
-- BrandOS suggests 3-5 new post ideas (angles, not drafts) built on one of the
-- "Next time" suggestions. Saved ideas live here; marking one "posted" awards
-- XP (XPEvent kind 'ideaPosted', deduped per idea).
--
-- RLS on, NO policies; anon/authenticated revoked. Server-only via Prisma
-- (same pattern as 020/022-034).
--
-- Idempotent. Requires 004 ("User"). Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/035_ideas.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Idea" (
  "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"       TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "postScoreId"  TEXT,                                   -- the analyzed post it grew from
  "postExcerpt"  TEXT CHECK (char_length("postExcerpt") <= 300),
  "suggestion"   TEXT NOT NULL CHECK (char_length("suggestion") <= 300),
  "title"        TEXT NOT NULL CHECK (char_length("title") <= 160),
  "hook"         TEXT NOT NULL CHECK (char_length("hook") <= 240),
  "format"       TEXT NOT NULL CHECK (char_length("format") <= 140),
  "why"          TEXT NOT NULL CHECK (char_length("why") <= 300),
  "status"       TEXT NOT NULL DEFAULT 'saved' CHECK ("status" IN ('saved', 'posted')),
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT now(),
  "postedAt"     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS "Idea_userId_createdAt_idx" ON "Idea" ("userId", "createdAt" DESC);

ALTER TABLE public."Idea" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Idea" FROM anon, authenticated;
