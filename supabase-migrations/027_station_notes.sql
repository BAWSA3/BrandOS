-- ============================================================================
-- Migration: the station polaroid board (Phase 1 of
-- docs/specs/STATION-BOARD-AND-BRAND-REVIEWS.md)
-- Date: 2026-10-06
--
-- "StationNote": a friend's note pinned on a claimed station. One per author
-- per station (they can edit/delete it). Author handle + avatar are snapshots
-- taken from their verified X connection at post time. The owner can hide any
-- note; 3+ reports auto-hide it until the owner looks.
-- "NoteReport": one report per user per note.
--
-- RLS on, NO policies; anon/authenticated revoked. Server routes only, via the
-- service-role Prisma client (same pattern as 020/022-026).
--
-- Idempotent. Requires 026. Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/027_station_notes.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "StationNote" (
  "id"              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "stationId"       TEXT NOT NULL REFERENCES "Station"("id") ON DELETE CASCADE,
  "authorUserId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "authorXHandle"   TEXT NOT NULL,
  "authorAvatarUrl" TEXT,
  "body"            TEXT NOT NULL CHECK (char_length("body") BETWEEN 1 AND 140),
  "sticker"         TEXT,
  "hiddenAt"        TIMESTAMPTZ,
  "hiddenBy"        TEXT CHECK ("hiddenBy" IN ('owner', 'reports')),
  "reportCount"     INTEGER NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "StationNote_stationId_authorUserId_key"
  ON "StationNote" ("stationId", "authorUserId");
CREATE INDEX IF NOT EXISTS "StationNote_stationId_createdAt_idx"
  ON "StationNote" ("stationId", "createdAt" DESC);

CREATE TABLE IF NOT EXISTS "NoteReport" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "noteId"         TEXT NOT NULL REFERENCES "StationNote"("id") ON DELETE CASCADE,
  "reporterUserId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "reason"         TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "NoteReport_noteId_reporterUserId_key"
  ON "NoteReport" ("noteId", "reporterUserId");

ALTER TABLE public."StationNote" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."NoteReport" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."StationNote" FROM anon, authenticated;
REVOKE ALL ON TABLE public."NoteReport" FROM anon, authenticated;
