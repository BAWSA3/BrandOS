-- ============================================================================
-- Migration: "Studio", the onboarding building game's progress per user
-- (step 2 of docs/specs/ONBOARDING-BUILDING-GAME.md)
-- Date: 2026-10-08
--
-- One row per user: their station's archetype and how far it's built
-- (0 plot, 1 foundation, 2 workstation, 3 billboard). Replaces the
-- browser-only "has completed onboarding" flag so progress follows the
-- account across devices.
--
-- RLS on, NO policies; anon/authenticated revoked. Server routes only, via the
-- service-role Prisma client (same pattern as 026/027).
--
-- Idempotent. Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/028_studio.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "Studio" (
  "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"        TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "archetype"     TEXT,
  "stage"         INTEGER NOT NULL DEFAULT 0,
  "foundationAt"  TIMESTAMPTZ,
  "workstationAt" TIMESTAMPTZ,
  "billboardAt"   TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Studio_stage_range" CHECK ("stage" BETWEEN 0 AND 3)
);
CREATE UNIQUE INDEX IF NOT EXISTS "Studio_userId_key" ON "Studio" ("userId");

ALTER TABLE public."Studio" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Studio" FROM anon, authenticated;
