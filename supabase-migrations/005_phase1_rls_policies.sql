-- ============================================================================
-- Migration: Phase 1 — RLS policies + public card view
-- Date: 2026-04-13
-- Branch: feat/phase-1-account-model
-- Reference: docs/PHASE-1-SCHEMA.md
--
-- This migration enables RLS on all Phase 1 tables and defines policies that
-- match the account model:
--   - Workspaces visible to members only
--   - Scans visible to workspace members; public card subset via dedicated view
--   - X account connections visible to workspace members; mutable by owner
--   - Audit log readable by admins (all) and self (last 30 days)
--
-- Legacy "BrandScans" RLS is NOT modified here. Application code still depends
-- on the existing anon read/insert policies. They get tightened in migration
-- 007 once the application has cut over to "BrandScan" (singular).
--
-- Apply order: 004 → 005 (this) → application code rollout → 007 cleanup.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Workspace
-- ----------------------------------------------------------------------------

ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;

CREATE POLICY workspace_select_member ON "Workspace"
  FOR SELECT TO authenticated
  USING (id IN (
    SELECT workspace_id FROM "WorkspaceMember"
    WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
  ));

CREATE POLICY workspace_update_admin ON "Workspace"
  FOR UPDATE TO authenticated
  USING (id IN (
    SELECT workspace_id FROM "WorkspaceMember"
    WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
      AND role IN ('owner', 'admin')
  ));

CREATE POLICY workspace_delete_owner ON "Workspace"
  FOR DELETE TO authenticated
  USING (owner_user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text));

-- INSERT: handled at app layer via service role (atomic create + Stripe customer)
-- No INSERT policy = blocked for authenticated by default.

-- ----------------------------------------------------------------------------
-- 2. WorkspaceMember
-- ----------------------------------------------------------------------------

ALTER TABLE "WorkspaceMember" ENABLE ROW LEVEL SECURITY;

CREATE POLICY wsmember_select_self_or_workspace ON "WorkspaceMember"
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
    OR workspace_id IN (
      SELECT workspace_id FROM "WorkspaceMember"
      WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
    )
  );

CREATE POLICY wsmember_insert_admin ON "WorkspaceMember"
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM "WorkspaceMember"
    WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
      AND role IN ('owner', 'admin')
  ));

CREATE POLICY wsmember_delete_admin_or_self ON "WorkspaceMember"
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
    OR workspace_id IN (
      SELECT workspace_id FROM "WorkspaceMember"
      WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
        AND role IN ('owner', 'admin')
    )
  );

-- ----------------------------------------------------------------------------
-- 3. PlatformConnection — RLS scoped by workspace_id (when set)
--
-- We don't enable RLS broadly because legacy code still uses this table for
-- non-workspace-scoped multi-platform connections. Phase 1 RLS only applies
-- to rows where workspace_id IS NOT NULL.
--
-- TODO migration 007: enable RLS unconditionally once all rows have workspace_id.
-- ----------------------------------------------------------------------------

-- Skipped until 007 — current PlatformConnection rows are pre-Phase-1 and
-- reading them via Prisma at the app layer (with explicit user_id checks)
-- is the safer interim path.

-- ----------------------------------------------------------------------------
-- 4. BrandScan
-- ----------------------------------------------------------------------------

ALTER TABLE "BrandScan" ENABLE ROW LEVEL SECURITY;

CREATE POLICY bscan_select_workspace_member ON "BrandScan"
  FOR SELECT TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM "WorkspaceMember"
    WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
  ));

CREATE POLICY bscan_insert_via_own_xaccount ON "BrandScan"
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
    AND platform_connection_id IN (
      SELECT id FROM "PlatformConnection"
      WHERE "userId" = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
        AND workspace_id = "BrandScan".workspace_id
        AND status = 'active'
        AND platform = 'x'
    )
  );

CREATE POLICY bscan_update_owner_or_admin ON "BrandScan"
  FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
    OR workspace_id IN (
      SELECT workspace_id FROM "WorkspaceMember"
      WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY bscan_delete_owner_or_admin ON "BrandScan"
  FOR DELETE TO authenticated
  USING (
    user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
    OR workspace_id IN (
      SELECT workspace_id FROM "WorkspaceMember"
      WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
        AND role IN ('owner', 'admin')
    )
  );

-- ----------------------------------------------------------------------------
-- 5. AuditReportShare + AuditReportShareView
-- ----------------------------------------------------------------------------

ALTER TABLE "AuditReportShare" ENABLE ROW LEVEL SECURITY;

CREATE POLICY ars_select_workspace_member ON "AuditReportShare"
  FOR SELECT TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM "WorkspaceMember"
    WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
  ));

CREATE POLICY ars_insert_workspace_member ON "AuditReportShare"
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by_user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
    AND workspace_id IN (
      SELECT workspace_id FROM "WorkspaceMember"
      WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
    )
  );

CREATE POLICY ars_update_creator ON "AuditReportShare"
  FOR UPDATE TO authenticated
  USING (created_by_user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text));

-- AuditReportShareView is internal — no RLS, no anon access. Only service-role
-- writes (from /share/audit/[token] route) and admin reads.
ALTER TABLE "AuditReportShareView" ENABLE ROW LEVEL SECURITY;
-- No policies = no access for authenticated/anon. Service-role bypasses RLS.

-- ----------------------------------------------------------------------------
-- 6. SecurityAuditLog
-- ----------------------------------------------------------------------------

ALTER TABLE "SecurityAuditLog" ENABLE ROW LEVEL SECURITY;

-- Admins read everything
CREATE POLICY sal_admin_read ON "SecurityAuditLog"
  FOR SELECT TO authenticated
  USING ((
    SELECT role FROM "User"
    WHERE "supabaseId" = auth.uid()::text
  ) = 'admin');

-- Users read their own events only, last 30 days (powers personal activity log)
CREATE POLICY sal_self_read_30d ON "SecurityAuditLog"
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
    AND created_at > now() - interval '30 days'
  );

-- INSERT: service-role only. Handlers and webhooks write via SUPABASE_SERVICE_ROLE_KEY.
-- No INSERT policy for authenticated → blocked by default.

-- ----------------------------------------------------------------------------
-- 7. PlanLimit — public read for the plan_limits config
-- ----------------------------------------------------------------------------

ALTER TABLE "PlanLimit" ENABLE ROW LEVEL SECURITY;

CREATE POLICY plan_limit_public_read ON "PlanLimit"
  FOR SELECT TO authenticated, anon
  USING (true);

-- INSERT/UPDATE/DELETE: service-role only (config managed via SQL).

-- ----------------------------------------------------------------------------
-- 8. brand_scans_public_card view — anon-readable card surface
--
-- This view exposes only the fields rendered on /card/[username]. The base
-- BrandScan table is locked down to authenticated workspace members above.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE VIEW brand_scans_public_card AS
SELECT
  id,
  x_username,
  score,
  archetype,
  phase_scores,
  strengths,
  improvements,
  influence_tier,
  scanned_at
FROM "BrandScan"
WHERE visibility = 'card_public' AND status = 'active';

-- Allow anon read on the view (card is public for non-opted-out scans)
GRANT SELECT ON brand_scans_public_card TO anon;

-- Lock down direct access to the base table from anon
REVOKE ALL ON "BrandScan" FROM anon;

-- Allow authenticated read via the view too (for card preview on dashboard)
GRANT SELECT ON brand_scans_public_card TO authenticated;

-- ----------------------------------------------------------------------------
-- 9. Helper function — assert_workspace_member()
--
-- Used by application code in service-role contexts to validate that a given
-- user is a member of a given workspace before performing privileged ops.
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION assert_workspace_member(p_user_id text, p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "WorkspaceMember"
    WHERE user_id = p_user_id AND workspace_id = p_workspace_id
  );
$$;

REVOKE ALL ON FUNCTION assert_workspace_member(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION assert_workspace_member(text, uuid) TO authenticated;

-- ============================================================================
-- End of 005_phase1_rls_policies.sql
-- Next: app-layer code (helpers, middleware, route updates) on this branch
-- Then: migration 006 — application cutover steps
-- Then: migration 007 — drop legacy Team, BrandScans, User subscription cols
-- ============================================================================
