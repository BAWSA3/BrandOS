-- ============================================================================
-- Migration: lock down tables flagged by the Supabase Security Advisor
-- Date: 2026-10-06
--
-- "Transaction" (prod + staging) and "Deal", "Invoice", "ApiUsageLog"
-- (staging) had RLS DISABLED with full anon/authenticated grants, so anyone
-- holding the public anon key (it ships in the site's JS) could read, insert,
-- update, delete or truncate them through the Supabase REST API. All four
-- were empty when found (2026-10-06), so no data was exposed.
--
-- The app only uses these through Prisma (owner role, bypasses RLS) and never
-- through the Supabase client, so: enable RLS with NO policies (deny all to
-- API roles) and revoke anon/authenticated grants entirely.
--
-- Idempotent; skips tables that don't exist (ApiUsageLog isn't on prod).
-- Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/022_rls_finance_and_usage_tables.sql
-- ============================================================================

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['Transaction', 'Deal', 'Invoice', 'ApiUsageLog'] LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;
END
$$;
