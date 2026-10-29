-- ============================================================================
-- Migration: first-run walkthrough + persona on "UserPreference"
-- Date: 2026-10-29
--
-- Two nullable columns on the per-account settings row (036):
--   "walkthroughDoneAt" when the member finished or skipped the first-run
--                       walkthrough (null = show it on their next v2 visit)
--   "persona"           their answer to "Which one are you?" (creator | founder
--                       | builder), so it follows the account across devices
--
-- Nullable, no backfill: existing rows read as "not seen yet", which is the
-- point (testers already in get the walkthrough once). The app reads these
-- columns with explicit selects and falls back to this-device storage until
-- this is applied. RLS and grants unchanged from 036 (server-only via Prisma).
--
-- Idempotent. Requires 036. Apply to staging, then prod:
--   npx prisma db execute --url "$DIRECT_URL" --file supabase-migrations/052_walkthrough_and_persona.sql
-- ============================================================================

ALTER TABLE "UserPreference" ADD COLUMN IF NOT EXISTS "walkthroughDoneAt" TIMESTAMPTZ;
ALTER TABLE "UserPreference" ADD COLUMN IF NOT EXISTS "persona" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'UserPreference_persona_check'
  ) THEN
    ALTER TABLE "UserPreference"
      ADD CONSTRAINT "UserPreference_persona_check"
      CHECK ("persona" IS NULL OR "persona" IN ('creator', 'founder', 'builder'));
  END IF;
END $$;
