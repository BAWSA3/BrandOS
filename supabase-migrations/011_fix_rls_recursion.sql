-- ============================================================================
-- Migration: Fix infinite-recursion in Phase 1 RLS policies
-- Date: 2026-06-18
-- Reference: docs/MINIMUM-LAUNCH-BAR.md, scripts/rls-acceptance.mjs
--
-- Bug: the policies in 005 reference "WorkspaceMember" via inline subqueries —
-- and "WorkspaceMember"'s OWN select policy references "WorkspaceMember" again.
-- Postgres evaluates the subquery under RLS, re-enters the same policy, and
-- aborts with: "infinite recursion detected in policy for relation
-- WorkspaceMember". Every read that depends on workspace membership
-- (WorkspaceMember, Workspace, BrandScan, AuditReportShare) therefore ERRORS
-- instead of enforcing isolation. (Masked in prod only because the app reads
-- via the service-role Prisma client, which bypasses RLS.)
--
-- Fix: move the membership lookups into SECURITY DEFINER helper functions. A
-- DEFINER function runs as its owner and does NOT re-apply the caller's RLS to
-- the tables it reads, which breaks the recursion. Policies then call the
-- helpers instead of inlining self-referential subqueries.
--
-- App impact: none. These are `TO authenticated` policies; the app's hot path
-- uses the service-role key (RLS-exempt). This only repairs the isolation layer
-- for direct authenticated-key access.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Helper functions (SECURITY DEFINER — bypass RLS internally, no recursion)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION current_app_user_id()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text
$$;

CREATE OR REPLACE FUNCTION current_user_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT workspace_id FROM "WorkspaceMember"
  WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
$$;

CREATE OR REPLACE FUNCTION current_user_admin_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT workspace_id FROM "WorkspaceMember"
  WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
    AND role IN ('owner', 'admin')
$$;

-- Whether the current user owns an ACTIVE X connection (by id) in a workspace.
-- DEFINER so it can read "PlatformConnection" + "User", both of which have RLS
-- enabled with no authenticated SELECT policy (deny-all) — they hold OAuth
-- tokens / PII and are intentionally service-role-only. Without this helper the
-- BrandScan insert policy's inline subquery returns zero rows and EVERY
-- authenticated insert is wrongly rejected.
CREATE OR REPLACE FUNCTION user_owns_active_x_connection(p_connection_id text, p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "PlatformConnection"
    WHERE id = p_connection_id
      AND "userId" = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
      AND workspace_id = p_workspace_id
      AND status = 'active'
      AND platform = 'x'
  )
$$;

REVOKE ALL ON FUNCTION current_app_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION current_user_workspace_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION current_user_admin_workspace_ids() FROM PUBLIC;
REVOKE ALL ON FUNCTION user_owns_active_x_connection(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION current_app_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_workspace_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_admin_workspace_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION user_owns_active_x_connection(text, uuid) TO authenticated;

-- ----------------------------------------------------------------------------
-- 2. WorkspaceMember — the recursion source
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS wsmember_select_self_or_workspace ON "WorkspaceMember";
CREATE POLICY wsmember_select_self_or_workspace ON "WorkspaceMember"
  FOR SELECT TO authenticated
  USING (
    user_id = current_app_user_id()
    OR workspace_id IN (SELECT current_user_workspace_ids())
  );

DROP POLICY IF EXISTS wsmember_insert_admin ON "WorkspaceMember";
CREATE POLICY wsmember_insert_admin ON "WorkspaceMember"
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id IN (SELECT current_user_admin_workspace_ids()));

DROP POLICY IF EXISTS wsmember_delete_admin_or_self ON "WorkspaceMember";
CREATE POLICY wsmember_delete_admin_or_self ON "WorkspaceMember"
  FOR DELETE TO authenticated
  USING (
    user_id = current_app_user_id()
    OR workspace_id IN (SELECT current_user_admin_workspace_ids())
  );

-- ----------------------------------------------------------------------------
-- 3. Workspace — clauses that referenced WorkspaceMember
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS workspace_select_member ON "Workspace";
CREATE POLICY workspace_select_member ON "Workspace"
  FOR SELECT TO authenticated
  USING (id IN (SELECT current_user_workspace_ids()));

DROP POLICY IF EXISTS workspace_update_admin ON "Workspace";
CREATE POLICY workspace_update_admin ON "Workspace"
  FOR UPDATE TO authenticated
  USING (id IN (SELECT current_user_admin_workspace_ids()));

-- workspace_delete_owner referenced only "User" (no recursion) — left as-is.

-- ----------------------------------------------------------------------------
-- 4. BrandScan — select/update/delete referenced WorkspaceMember
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS bscan_select_workspace_member ON "BrandScan";
CREATE POLICY bscan_select_workspace_member ON "BrandScan"
  FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT current_user_workspace_ids()));

DROP POLICY IF EXISTS bscan_update_owner_or_admin ON "BrandScan";
CREATE POLICY bscan_update_owner_or_admin ON "BrandScan"
  FOR UPDATE TO authenticated
  USING (
    user_id = current_app_user_id()
    OR workspace_id IN (SELECT current_user_admin_workspace_ids())
  );

DROP POLICY IF EXISTS bscan_delete_owner_or_admin ON "BrandScan";
CREATE POLICY bscan_delete_owner_or_admin ON "BrandScan"
  FOR DELETE TO authenticated
  USING (
    user_id = current_app_user_id()
    OR workspace_id IN (SELECT current_user_admin_workspace_ids())
  );

-- bscan_insert_via_own_xaccount inlined subqueries against "User" and
-- "PlatformConnection". Both now have RLS enabled with no authenticated SELECT
-- policy, so those subqueries returned zero rows and rejected EVERY authenticated
-- insert. Rewrite to use the DEFINER helpers (same security: self-owned row +
-- owned active X connection in the same workspace).
DROP POLICY IF EXISTS bscan_insert_via_own_xaccount ON "BrandScan";
CREATE POLICY bscan_insert_via_own_xaccount ON "BrandScan"
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = current_app_user_id()
    AND user_owns_active_x_connection(platform_connection_id, workspace_id)
  );

-- ----------------------------------------------------------------------------
-- 5. AuditReportShare — select/insert referenced WorkspaceMember
-- ----------------------------------------------------------------------------

DROP POLICY IF EXISTS ars_select_workspace_member ON "AuditReportShare";
CREATE POLICY ars_select_workspace_member ON "AuditReportShare"
  FOR SELECT TO authenticated
  USING (workspace_id IN (SELECT current_user_workspace_ids()));

DROP POLICY IF EXISTS ars_insert_workspace_member ON "AuditReportShare";
CREATE POLICY ars_insert_workspace_member ON "AuditReportShare"
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by_user_id = current_app_user_id()
    AND workspace_id IN (SELECT current_user_workspace_ids())
  );

-- ars_update_creator referenced only "User" (no recursion) — left as-is.

-- ============================================================================
-- End of 011_fix_rls_recursion.sql
-- Verify with: npm run test:rls  (section C should be all green)
-- ============================================================================
