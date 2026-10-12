-- ============================================================================
-- Migration: close public (anon-key) access to the email list and scan writes
-- Date: 2026-10-12
--
-- Found in a share-asset QA pass (read-only checks against prod):
--
-- 1. "EmailSignup": policy "Allow service role to read" is FOR SELECT TO public
--    USING (true). "public" includes anon, and anon has the SELECT grant, so
--    anyone with the publishable key from the site's JS could read the whole
--    list (verified: count-only anon request returned 1000 rows readable).
--    Policy "email_signup_insert_limited" let anyone insert straight through
--    the REST API, skipping BotID + rate limits.
-- 2. "BrandScans": policy "Allow anonymous inserts" let anyone forge scan rows
--    for any handle. Link previews (/api/og) and breakdown emails read the
--    latest row, so a forged row could show a fake score.
--
-- All app reads/writes of these tables now go through Prisma (service
-- connection, bypasses RLS): src/lib/newsletter.ts, the unsubscribe route,
-- recordScan in src/lib/scan-tracking.ts, /api/reserve-station, /api/breakdown.
--
-- APPLY ONLY AFTER that code is deployed to the same environment, or signups,
-- unsubscribes and scan logging will fail. BrandScans keeps its anon SELECT
-- policy (scan results are public; legacy read routes still use the anon key).
--
-- Idempotent. Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/031_lock_email_signup_and_scan_inserts.sql
-- ============================================================================

-- EmailSignup: server-only
ALTER TABLE public."EmailSignup" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow service role to read" ON public."EmailSignup";
DROP POLICY IF EXISTS "email_signup_insert_limited" ON public."EmailSignup";
REVOKE ALL ON TABLE public."EmailSignup" FROM anon, authenticated;

-- EmailSend (send log): server-only (already no policies; drop the grants too)
ALTER TABLE public."EmailSend" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."EmailSend" FROM anon, authenticated;

-- BrandScans: public read stays, writes are server-only
ALTER TABLE public."BrandScans" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON public."BrandScans";
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public."BrandScans" FROM anon, authenticated;
