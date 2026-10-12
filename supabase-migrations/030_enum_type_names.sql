-- ============================================================================
-- Migration: rename Postgres enum types to the names Prisma maps to
-- Date: 2026-10-11
--
-- 654a86a (prod hotfix, 2026-10-08) added @@map("snake_case") to every Prisma
-- enum to match prod's type names. Staging was built from the Prisma baseline
-- and still has the PascalCase names, so on staging every query touching an
-- enum column fails with: type "public.scan_status" does not exist
-- (dashboard scans, user creation on sign-in, ...).
--
-- Renames each PascalCase type only when the snake_case one doesn't exist yet,
-- so this is a no-op on prod (already snake_case) and safe to re-run.
-- Renaming a type keeps every column, default and value; no data changes.
--
-- Apply to staging (prod: no-op, optional):
--   node --env-file=.env.local scripts/apply-migration.mjs supabase-migrations/030_enum_type_names.sql
-- ============================================================================

DO $$
DECLARE
  pair TEXT[];
BEGIN
  FOREACH pair SLICE 1 IN ARRAY ARRAY[
    ['PlanTier',               'plan_tier'],
    ['WorkspaceType',          'workspace_type'],
    ['WorkspaceRole',          'workspace_role'],
    ['ConnectedAccountStatus', 'connected_account_status'],
    ['ScanVisibility',         'scan_visibility'],
    ['ScanStatus',             'scan_status'],
    ['AuditEventCategory',     'audit_event_category'],
    ['UserRole',               'user_role'],
    ['AccountMigrationStatus', 'migration_status']
  ]
  LOOP
    IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
               WHERE n.nspname = 'public' AND t.typname = pair[1])
       AND NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace
                       WHERE n.nspname = 'public' AND t.typname = pair[2]) THEN
      EXECUTE format('ALTER TYPE public.%I RENAME TO %I', pair[1], pair[2]);
      RAISE NOTICE 'renamed % -> %', pair[1], pair[2];
    END IF;
  END LOOP;
END $$;
