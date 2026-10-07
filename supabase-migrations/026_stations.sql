-- ============================================================================
-- Migration: "Station", a claimed brand station (Phase 0 of the station board
-- + brand reviews spec, docs/specs/STATION-BOARD-AND-BRAND-REVIEWS.md)
-- Date: 2026-10-06
--
-- A reservation (EmailSignup) is made by typing an email + handle, so nobody
-- has proved they own the X account. Claiming does: the user signs in with X
-- and the server checks their verified X connection matches the handle. The
-- Station row records the owner and is the anchor for the polaroid board and
-- brand reviews in later phases.
--
-- One station per handle and per owner. Bound to the X user id (ownerXId) as
-- well as the handle, so a later handle change can't hand the station to
-- someone else.
--
-- RLS on, NO policies; anon/authenticated revoked. Server routes only, via the
-- service-role Prisma client (same pattern as 020/022-025).
--
-- Idempotent. Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/026_stations.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Station" (
  "id"                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "handle"            TEXT NOT NULL,
  "ownerUserId"       TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "ownerXId"          TEXT NOT NULL,
  "reservationNumber" INTEGER,
  "archetype"         TEXT,
  "claimedAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Station_handle_lowercase" CHECK ("handle" = lower("handle"))
);
CREATE UNIQUE INDEX IF NOT EXISTS "Station_handle_key" ON "Station" ("handle");
CREATE UNIQUE INDEX IF NOT EXISTS "Station_ownerUserId_key" ON "Station" ("ownerUserId");
CREATE UNIQUE INDEX IF NOT EXISTS "Station_ownerXId_key" ON "Station" ("ownerXId");

ALTER TABLE public."Station" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Station" FROM anon, authenticated;
