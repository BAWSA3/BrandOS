-- ============================================================================
-- Migration: email send log + "would you pay?" pricing poll
-- Date: 2026-10-05
--
-- "EmailSend": one row per (signup, campaign). The unique key is the
-- once-per-address guarantee for the reserve confirmation (so the public
-- reserve form can't be used to spam someone) and makes the launch-email
-- script safe to re-run.
--
-- "PricingPollVote": one vote per signup from the launch email's one-click
-- poll (standard / premium / founding / not-yet). Changing your mind
-- overwrites the vote.
--
-- Both are written only by the server through the service-role Prisma client.
-- RLS is enabled with NO policies, so the public anon key can't read them.
--
-- Idempotent. Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/020_email_sends_and_pricing_poll.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "EmailSend" (
  "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "emailSignupId" TEXT NOT NULL REFERENCES "EmailSignup"("id") ON DELETE CASCADE,
  "campaign"      TEXT NOT NULL,
  "resendId"      TEXT,
  "sentAt"        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "EmailSend_emailSignupId_campaign_key"
  ON "EmailSend" ("emailSignupId", "campaign");
CREATE INDEX IF NOT EXISTS "EmailSend_campaign_idx" ON "EmailSend" ("campaign");

CREATE TABLE IF NOT EXISTS "PricingPollVote" (
  "id"            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "emailSignupId" TEXT NOT NULL REFERENCES "EmailSignup"("id") ON DELETE CASCADE,
  "choice"        TEXT NOT NULL CHECK ("choice" IN ('standard', 'premium', 'founding', 'not-yet')),
  "campaign"      TEXT NOT NULL,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS "PricingPollVote_emailSignupId_key"
  ON "PricingPollVote" ("emailSignupId");

ALTER TABLE public."EmailSend" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."PricingPollVote" ENABLE ROW LEVEL SECURITY;
