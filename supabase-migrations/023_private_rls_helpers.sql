-- ============================================================================
-- Migration: move RLS helper functions out of the public API + pin search_path
-- Date: 2026-10-06
--
-- Supabase Security Advisor flagged 6 BrandOS SECURITY DEFINER helpers as
-- callable through /rest/v1/rpc/* by anon and authenticated:
--   assert_workspace_member, current_app_user_id,
--   current_user_admin_workspace_ids, current_user_workspace_ids,
--   is_team_member, user_owns_active_x_connection
-- 84 RLS policies (all TO authenticated) call them, so signed-in users must
-- keep EXECUTE. The fix is to move them to the non-exposed "private" schema:
-- policies reference functions by OID, so they keep working, while the RPC
-- endpoints disappear. Anon loses EXECUTE (no anon/public policy uses them;
-- verified 2026-10-06 on prod + staging). The bodies pin search_path=public,
-- so their table lookups are unaffected by the move. The app never calls them
-- via supabase.rpc().
--
-- Also pins search_path on set_updated_at (Workspace trigger).
--
-- NOT touched on purpose:
--   check_request(): PostgREST db_pre_request hook; must stay callable.
--   roll_tier, normalize_email, trainer_signups_normalize_email_trigger:
--     VERITY trainer objects living in the prod DB; separate decision.
--
-- Idempotent (skips functions already moved or missing). Apply to staging,
-- run `npm run test:rls`, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/023_private_rls_helpers.sql
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

DO $$
DECLARE
  sig text;
  fn  regprocedure;
BEGIN
  FOREACH sig IN ARRAY ARRAY[
    'assert_workspace_member(text, uuid)',
    'current_app_user_id()',
    'current_user_admin_workspace_ids()',
    'current_user_workspace_ids()',
    'is_team_member(text)',
    'user_owns_active_x_connection(text, uuid)'
  ] LOOP
    fn := to_regprocedure('public.' || sig);
    IF fn IS NOT NULL THEN
      EXECUTE format('ALTER FUNCTION %s SET SCHEMA private', fn);
    END IF;
    fn := to_regprocedure('private.' || sig);
    IF fn IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', fn);
    END IF;
  END LOOP;

  IF to_regprocedure('public.set_updated_at()') IS NOT NULL THEN
    ALTER FUNCTION public.set_updated_at() SET search_path = public, pg_temp;
  END IF;
END
$$;
