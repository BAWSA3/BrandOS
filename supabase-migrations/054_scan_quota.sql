-- ============================================================================
-- Migration: "ScanQuota" — daily fresh-scan limit
-- Date: 2026-10-29
--
-- Every fresh brand read pays SocialData (and the model). Decided with Bawsa:
--   signed out          1 fresh scan a day (per device: hashed IP + user agent)
--   free + trial/codes  3 fresh scans a day
--   paid ($29 / Founding) and admins: unlimited (no row is written)
-- Re-opening a stored read (under 7 days) or a cached score is free. The day
-- is UTC; the count resets at midnight UTC.
--
-- One row per subject per day. "subject" is 'u:<userId>' or 'd:<sha256>'
-- (never a raw IP). Old rows are safe to delete any time.
--
-- New table: the app works before this is applied (the limit fails open and
-- every scan is allowed, as today).
--
-- RLS on, NO policies; anon/authenticated revoked. Server-only via Prisma.
-- Idempotent. Apply to staging, then prod:
--   npx prisma db execute --url "$DIRECT_URL" --file supabase-migrations/054_scan_quota.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ScanQuota" (
  "subject"   TEXT NOT NULL CHECK ("subject" ~ '^(u:[A-Za-z0-9_-]{1,64}|d:[0-9a-f]{64})$'),
  "day"       DATE NOT NULL,
  "count"     INTEGER NOT NULL DEFAULT 0 CHECK ("count" >= 0),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("subject", "day")
);
CREATE INDEX IF NOT EXISTS "ScanQuota_day_idx" ON "ScanQuota" ("day");

ALTER TABLE "ScanQuota" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "ScanQuota" FROM anon, authenticated;
