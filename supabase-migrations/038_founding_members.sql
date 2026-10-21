-- ============================================================================
-- Migration: "FoundingMember" — the Founding 100
-- Date: 2026-10-19
--
-- The first 100 paying members (docs/LAUNCH-PLAN.md) keep $29/mo forever and
-- get a recorded brand teardown. A member is numbered 1–100 on their first
-- real (non-zero) paid invoice. The number is the primary key, so two
-- concurrent conversions can't take the same spot.
--
-- A separate table (not a "User" column) so the app keeps working before this
-- is applied: the counter reads as "100 left" and numbering is skipped.
--
-- RLS on, NO policies; anon/authenticated revoked. Server-only via Prisma.
--
-- Idempotent. Requires 004 ("User"). Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/038_founding_members.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "FoundingMember" (
  "number"    INTEGER PRIMARY KEY CHECK ("number" BETWEEN 1 AND 100),
  "userId"    TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public."FoundingMember" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."FoundingMember" FROM anon, authenticated;
