-- ============================================================================
-- Migration: brand_scans_public_card runs as the caller, read-only for clients
-- Date: 2026-10-16
--
-- Found in the launch preflight: on STAGING the view had no security_invoker,
-- so it ran as its owner (postgres) and bypassed RLS on "BrandScan". It is a
-- simple, auto-updatable view and anon/authenticated held INSERT/UPDATE/DELETE
-- on it, so the public anon key could edit or delete public scans through it.
-- Prod already had security_invoker=true (safe); this makes both match and
-- drops the write grants everywhere. No app code reads this view.
--
-- Idempotent. Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/037_public_card_view_invoker.sql
-- ============================================================================

ALTER VIEW public.brand_scans_public_card SET (security_invoker = true);

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.brand_scans_public_card FROM anon, authenticated;
GRANT SELECT ON public.brand_scans_public_card TO anon, authenticated;
