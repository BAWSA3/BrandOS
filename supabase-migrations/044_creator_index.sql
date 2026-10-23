-- ============================================================================
-- Migration: the BrandOS Creator Index ("IndexEntry", "IndexView")
-- Date: 2026-10-23
--
-- docs/GTM-OPERATING-PLAN.md: a public book of creators brands can browse,
-- with a real brand read behind every entry. Opt-in account holders only.
--
-- "IndexEntry": one per user who joined. "number" is their Index number
--   ("No. 0042"), assigned once at first join and kept if they leave and come
--   back. "niches" (up to 3, from a fixed list in src/lib/index-rules.ts) and
--   "blurb" (one line for brands) are what they chose. "score"/"archetype"
--   are copied from their latest brand read and refreshed when they rescan.
--   "listed" = false hides them from the Index (leave any time).
-- "IndexView": a signed-in visitor (not the member) opened the member's
--   /@handle page. One row per viewer per member per day. Members with Pro
--   see "N people viewed you" and which brand/agency teams did.
--
-- New tables only: the app works before this is applied (the Index is behind
-- the INDEX_ENABLED flag and reads fall back to "not a member").
--
-- RLS on, NO policies; anon/authenticated revoked. Server-only via Prisma.
-- Idempotent. Requires 004 ("User", "Workspace"). Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/044_creator_index.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "IndexEntry" (
  "id"            TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  "userId"        TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "number"        SERIAL UNIQUE,
  "handle"        TEXT NOT NULL CHECK ("handle" = lower("handle") AND "handle" ~ '^[a-z0-9_]{1,15}$'),
  "displayHandle" TEXT NOT NULL CHECK (char_length("displayHandle") BETWEEN 1 AND 15),
  "xUserId"       TEXT CHECK ("xUserId" ~ '^[0-9]{1,25}$'),
  "niches"        TEXT[] NOT NULL DEFAULT '{}' CHECK (cardinality("niches") <= 3),
  "blurb"         TEXT NOT NULL DEFAULT '' CHECK (char_length("blurb") <= 140),
  "score"         INTEGER CHECK ("score" BETWEEN 0 AND 100),
  "archetype"     TEXT CHECK (char_length("archetype") <= 40),
  "listed"        BOOLEAN NOT NULL DEFAULT true,
  "joinedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "IndexEntry_handle_key" ON "IndexEntry" ("handle");
CREATE INDEX IF NOT EXISTS "IndexEntry_listed_joinedAt_idx" ON "IndexEntry" ("listed", "joinedAt" DESC);

CREATE TABLE IF NOT EXISTS "IndexView" (
  "entryId"           TEXT NOT NULL REFERENCES "IndexEntry"("id") ON DELETE CASCADE,
  "viewerUserId"      TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "viewerWorkspaceId" UUID REFERENCES "Workspace"("id") ON DELETE SET NULL,
  "day"               DATE NOT NULL DEFAULT ((now() AT TIME ZONE 'utc')::date),
  "viewedAt"          TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("entryId", "viewerUserId", "day")
);
CREATE INDEX IF NOT EXISTS "IndexView_entry_viewedAt_idx" ON "IndexView" ("entryId", "viewedAt" DESC);

ALTER TABLE public."IndexEntry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."IndexView" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."IndexEntry" FROM anon, authenticated;
REVOKE ALL ON TABLE public."IndexView" FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public."IndexEntry_number_seq" FROM anon, authenticated;
