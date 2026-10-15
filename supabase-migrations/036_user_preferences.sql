-- ============================================================================
-- Migration: "UserPreference" — per-account display settings
-- Date: 2026-10-14
--
-- One row per user. First setting: the dashboard colorway picked in Settings
-- (bone | night | klein | paper), so it follows the account across devices.
-- A separate table (not a "User" column) so the app keeps working before this
-- is applied: reads fall back to the default colorway.
--
-- RLS on, NO policies; anon/authenticated revoked. Server-only via Prisma
-- (same pattern as 020/022-035).
--
-- Idempotent. Requires 004 ("User"). Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/036_user_preferences.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "UserPreference" (
  "userId"            TEXT PRIMARY KEY REFERENCES "User"("id") ON DELETE CASCADE,
  "dashboardColorway" TEXT NOT NULL DEFAULT 'bone'
                      CHECK ("dashboardColorway" IN ('bone', 'night', 'klein', 'paper')),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public."UserPreference" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."UserPreference" FROM anon, authenticated;
