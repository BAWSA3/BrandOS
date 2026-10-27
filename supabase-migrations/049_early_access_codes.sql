-- ============================================================================
-- Migration: early-access codes ("EarlyAccessCode") + tester feedback
-- Date: 2026-10-27
--
-- Decided with Bawsa on Oct 27: one personal, single-use code per person,
-- labelled with who it was given to (e.g. "@aunnieonchain"), shared as a link
-- (mybrandos.app/i/AU7K-2QX9) or typed in a "Have a code?" box. A redeemed
-- code gives, by default:
--   perkIndex          the Creator Index before it opens (instead of hand-editing
--                      INDEX_ALLOWLIST)
--   perkFoundingPrice  the Founding price ($29/month for life) even after the 100
--                      seats are gone
--   perkTester         an "Early access" tag and a feedback line to Bawsa
--
-- "EarlyAccessCode": code is 8 characters from A-Z/2-9 without 0, O, 1, I
--   (stored uppercase, no dash). Single use is enforced by the database:
--   redemption is one conditional UPDATE (redeemedAt IS NULL AND revokedAt IS
--   NULL), and "redeemedByUserId" is UNIQUE (one code per user).
-- "TesterFeedback": a tester's message to Bawsa (also emailed on arrival).
--
-- New tables only: the app works before this is applied (codes can't be
-- redeemed yet; every early-access check falls back to "no").
--
-- RLS on, NO policies; anon/authenticated revoked. Server-only via Prisma.
-- Idempotent. Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/049_early_access_codes.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "EarlyAccessCode" (
  "id"                TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  "code"              TEXT NOT NULL UNIQUE CHECK ("code" ~ '^[ABCDEFGHJKLMNPQRSTUVWXYZ2-9]{8}$'),
  "label"             TEXT NOT NULL CHECK (length("label") BETWEEN 1 AND 200),
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT now(),
  "redeemedAt"        TIMESTAMPTZ,
  "redeemedByUserId"  TEXT UNIQUE REFERENCES "User"("id") ON DELETE SET NULL,
  "revokedAt"         TIMESTAMPTZ,
  "perkIndex"         BOOLEAN NOT NULL DEFAULT true,
  "perkFoundingPrice" BOOLEAN NOT NULL DEFAULT true,
  "perkTester"        BOOLEAN NOT NULL DEFAULT true,
  -- a redeemer always has a redemption time (a deleted user leaves the time)
  CHECK ("redeemedByUserId" IS NULL OR "redeemedAt" IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS "TesterFeedback" (
  "id"        TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  "userId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "message"   TEXT NOT NULL CHECK (length("message") BETWEEN 1 AND 2000),
  "page"      TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "TesterFeedback_userId_createdAt_idx"
  ON "TesterFeedback" ("userId", "createdAt" DESC);

ALTER TABLE public."EarlyAccessCode" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."EarlyAccessCode" FROM anon, authenticated;
ALTER TABLE public."TesterFeedback" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."TesterFeedback" FROM anon, authenticated;
