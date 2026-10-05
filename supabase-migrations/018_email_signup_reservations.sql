-- ============================================================================
-- Migration: "Reserve your brand station" on the existing email list
-- Date: 2026-10-04
--
-- The post-scan CTA captures emails into the existing "EmailSignup" list (the
-- ~890 March signups). Many reservers will already be on it, and the row keeps
-- its original `source`, so a separate marker records the reservation without
-- losing where the person first signed up.
--
-- Idempotent. Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/018_email_signup_reservations.sql
-- Writes go through /api/reserve-station with the service-role Prisma client,
-- so no RLS policy change is needed.
-- ============================================================================

ALTER TABLE "EmailSignup"
  ADD COLUMN IF NOT EXISTS "reservedAt" TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS "reservedArchetype" TEXT;

CREATE INDEX IF NOT EXISTS "EmailSignup_reservedAt_idx" ON "EmailSignup" ("reservedAt");
