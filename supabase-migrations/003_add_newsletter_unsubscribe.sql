-- ============================================================================
-- Migration: Add unsubscribe support to EmailSignup
-- Date: 2026-03-26
-- Purpose: Newsletter infrastructure — track opt-out status
-- ============================================================================

-- Add unsubscribe columns
ALTER TABLE "EmailSignup" ADD COLUMN IF NOT EXISTS "unsubscribed" boolean DEFAULT false;
ALTER TABLE "EmailSignup" ADD COLUMN IF NOT EXISTS "unsubscribedAt" timestamptz;

-- Index for filtering active subscribers
CREATE INDEX IF NOT EXISTS idx_email_signup_unsubscribed ON "EmailSignup" ("unsubscribed");
