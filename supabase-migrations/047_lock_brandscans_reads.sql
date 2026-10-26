-- ============================================================================
-- Migration: BrandScans is no longer readable with the public anon key
-- Date: 2026-10-24
--
-- Found in the prod QA pass (read-only anon-key probe of every table): the
-- legacy "BrandScans" table was fully readable through Supabase's REST API with
-- the publishable key from the site's JS. 6,736 rows, every column (userId,
-- insights, strengths, improvements, next moves, summary), ~1,000 rows per
-- request: a full-table egress vector (see the Sept 2026 egress incident) and
-- a userId-to-handle map. Migration 031 deliberately kept the anon SELECT
-- because legacy routes read the table with the anon key.
--
-- Those reads now go through Prisma (service connection, bypasses RLS):
-- src/lib/brand-scans-read.ts, used by /api/intelligence/report,
-- /api/intelligence/cohort, /api/opp/match, /api/archetype-scan and the
-- scan-tracking counters (PR fix/prod-hardening-oct24). Writes have been
-- server-only since 031.
--
-- APPLY ONLY AFTER that code is deployed to the same environment, or the
-- intelligence report, cohort stats and opponent matching will return empty.
--
-- After this, the only anon-readable table with rows is "PlanLimit" (public
-- plan config, intended; asserted by scripts/rls-acceptance.mjs).
--
-- Idempotent. Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/047_lock_brandscans_reads.sql
-- ============================================================================

ALTER TABLE public."BrandScans" ENABLE ROW LEVEL SECURITY;

-- Drop every SELECT policy on the table (names differ between environments).
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'BrandScans' AND cmd IN ('SELECT', 'ALL')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public."BrandScans"', pol.policyname);
  END LOOP;
END $$;

REVOKE ALL ON TABLE public."BrandScans" FROM anon, authenticated;
