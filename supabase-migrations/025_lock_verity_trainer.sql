-- ============================================================================
-- Migration: lock down the retired VERITY trainer objects in the prod DB
-- Date: 2026-10-06
--
-- The VERITY trainer (dead as of 2026-10-06, per Jeffrey) shares BrandOS's
-- prod database. Its objects were reachable through the public API:
--   tier_supply      SELECT true policy for anon/authenticated
--   roll_tier()      SECURITY DEFINER, executable by anon via /rest/v1/rpc
--   all its tables   full anon/authenticated table grants
-- Data is KEPT (trainer_signups had 10 rows); nothing is dropped. This only
-- removes API access: drops non-service policies, revokes anon/authenticated
-- on the tables, revokes EXECUTE on the functions and pins their search_path
-- (clears the Security Advisor warnings). service_role/owner access is
-- unchanged. BrandOS code does not reference any of these.
--
-- Idempotent; skips anything missing (these only exist on prod).
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/025_lock_verity_trainer.sql
-- ============================================================================

DO $$
DECLARE
  t text;
  pol record;
  sig text;
  fn regprocedure;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'trainer_signups', 'tier_supply', 'tier_roll_log', 'signup_attempts', 'signup_audit_log'
  ] LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      FOR pol IN
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public' AND tablename = t AND roles <> ARRAY['service_role']::name[]
      LOOP
        EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
      END LOOP;
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
      EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated', t);
    END IF;
  END LOOP;

  FOREACH sig IN ARRAY ARRAY[
    'roll_tier()', 'normalize_email(text)', 'trainer_signups_normalize_email_trigger()'
  ] LOOP
    fn := to_regprocedure('public.' || sig);
    IF fn IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn);
      EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', fn);
    END IF;
  END LOOP;
END
$$;
