-- ============================================================================
-- Migration: "PersonToKnow" — People to know (dashboard v2 Playbook + Today)
-- Date: 2026-10-29
--
-- When a member lacks known accounts around them (few known accounts engage
-- with their posts, or Scale is their weakest phase), the Playbook names 3
-- creators in their niche to reach out to: 2 peers + 1 one step bigger, each
-- with one line on why they fit and a drafted first DM (copied out; BrandOS
-- never sends). One list per member per week ("weekOf" = that week's Monday,
-- UTC); people they ticked roll off and aren't suggested again.
--
-- "messagedAt" is the member's own tick ("I messaged them"); BrandOS can't see
-- DMs. Whether it worked is read later from AudienceInteraction (041): did this
-- handle engage with the member's posts after messagedAt.
--
-- New table: the app works before this is applied (the section shows "coming
-- soon" instead of a list and nothing is generated or charged).
--
-- RLS on, NO policies; anon/authenticated revoked. Server-only via Prisma.
-- Idempotent. Apply to staging, then prod:
--   npx prisma db execute --url "$DIRECT_URL" --file supabase-migrations/053_people_to_know.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PersonToKnow" (
  "id"            TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  "userId"        TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "weekOf"        DATE NOT NULL,
  "handle"        TEXT NOT NULL CHECK ("handle" = lower("handle") AND "handle" ~ '^[a-z0-9_]{1,15}$'),
  "displayHandle" TEXT NOT NULL,
  "name"          TEXT,
  "avatarUrl"     TEXT,
  "followers"     INTEGER NOT NULL DEFAULT 0,
  "tier"          TEXT NOT NULL CHECK ("tier" IN ('peer', 'bigger')),
  "why"           TEXT NOT NULL,
  "dm"            TEXT NOT NULL,
  "messagedAt"    TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("userId", "weekOf", "handle")
);
CREATE INDEX IF NOT EXISTS "PersonToKnow_userId_weekOf_idx" ON "PersonToKnow" ("userId", "weekOf");
CREATE INDEX IF NOT EXISTS "PersonToKnow_userId_handle_idx" ON "PersonToKnow" ("userId", "handle");

ALTER TABLE public."PersonToKnow" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."PersonToKnow" FROM anon, authenticated;
