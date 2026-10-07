-- ============================================================================
-- Migration: lock the retired Find Your Opp tables
-- Date: 2026-10-06
--
-- OppEmailCaptures / OppMatchups / OppPairings had anonymous INSERT/UPDATE
-- policies with `true` (Security Advisor: rls_policy_always_true) AND an
-- anonymous SELECT `true` policy, so anyone with the public anon key could
-- read every captured email. All three were empty on 2026-10-06 (no exposure).
--
-- Find Your Opp is retired (/opp redirects home since PR #40). Its API routes
-- write through the anon key, so APPLY THIS ONLY AFTER #40 IS ON PROD; after
-- it, those routes can no longer write (intended).
--
-- Drops every policy on the three tables (RLS stays on = deny all to API
-- roles) and revokes anon/authenticated grants. Idempotent.
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/024_lock_opp_tables.sql
-- ============================================================================

DO $$
DECLARE
  t text;
  pol record;
BEGIN
  FOREACH t IN ARRAY ARRAY['OppEmailCaptures', 'OppMatchups', 'OppPairings'] LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
        EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
      END LOOP;
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
END
$$;
