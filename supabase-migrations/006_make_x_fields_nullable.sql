-- ============================================================================
-- Migration: Make X-specific fields nullable on User table
-- Date: 2026-04-15
-- Branch: feat/phase-1-account-model
--
-- With Phase 1, users can sign up via email/password or Google/Apple BEFORE
-- connecting their X account. xUsername and xId become populated only after
-- the user completes the "Connect X" flow from the dashboard.
-- ============================================================================

ALTER TABLE "User" ALTER COLUMN "xUsername" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "xId" DROP NOT NULL;
