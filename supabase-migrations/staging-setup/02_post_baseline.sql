-- ============================================================================
-- Post-baseline SQL for BrandOS staging DB
-- Run AFTER /tmp/prisma-baseline.sql (which creates all Prisma tables).
-- This adds: RLS policies, seed data, triggers, and non-Prisma tables (Opp*).
-- Safe to re-run — uses IF NOT EXISTS / DROP IF EXISTS / ON CONFLICT.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- SECTION A: BrandScans RLS (legacy table, from migration 002)
-- ----------------------------------------------------------------------------

ALTER TABLE "BrandScans" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous inserts" ON "BrandScans";
DROP POLICY IF EXISTS "Allow anonymous reads" ON "BrandScans";
DROP POLICY IF EXISTS "BrandScans user select" ON "BrandScans";
DROP POLICY IF EXISTS "BrandScans user insert" ON "BrandScans";
DROP POLICY IF EXISTS "BrandScans user update" ON "BrandScans";
DROP POLICY IF EXISTS "BrandScans user delete" ON "BrandScans";

CREATE POLICY "Allow anonymous inserts" ON "BrandScans"
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous reads" ON "BrandScans"
  FOR SELECT TO anon USING (true);

-- ----------------------------------------------------------------------------
-- SECTION B: PlanLimit seed rows (extended with worlds columns from migration 008)
-- ----------------------------------------------------------------------------

INSERT INTO "PlanLimit" (
  plan,
  scans_per_day,
  x_accounts_per_seat,
  multi_platform_enabled,
  competitor_watchlist_enabled,
  scheduled_rescans_enabled,
  priority_queue_enabled,
  max_flagged_tweets,
  audit_summary_max_chars,
  max_strengths,
  max_improvements,
  custom_world_builder_enabled,
  premium_worlds_enabled
) VALUES
  ('FREE',       1,    1,   false, false, false, false, 3,  800,  3,  3,  false, false),
  ('PRO',        20,   3,   true,  true,  true,  false, 5,  1200, 5,  5,  false, true),
  ('MAX',        100,  5,   true,  true,  true,  true,  10, 2000, 7,  7,  true,  true),
  ('TEAM',       20,   3,   true,  true,  true,  false, 5,  1200, 5,  5,  true,  true),
  ('ENTERPRISE', 9999, 999, true,  true,  true,  true,  20, 4000, 10, 10, true,  true)
ON CONFLICT (plan) DO NOTHING;

-- ----------------------------------------------------------------------------
-- SECTION C: updated_at triggers (Prisma doesn't generate these)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workspace_updated_at ON "Workspace";
CREATE TRIGGER workspace_updated_at
  BEFORE UPDATE ON "Workspace"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS customworld_updated_at ON "CustomWorld";
CREATE TRIGGER customworld_updated_at
  BEFORE UPDATE ON "CustomWorld"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- SECTION D: AuditReportShareView (from migration 004, not in Prisma schema)
-- Used by /share/audit/[token] route to track per-IP view counts.
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "AuditReportShareView" (
  share_id uuid NOT NULL REFERENCES "AuditReportShare"(id) ON DELETE CASCADE,
  ip_hash text NOT NULL,
  first_viewed_at timestamptz NOT NULL DEFAULT now(),
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  view_count integer NOT NULL DEFAULT 1,
  PRIMARY KEY (share_id, ip_hash)
);

ALTER TABLE "AuditReportShareView" ENABLE ROW LEVEL SECURITY;
-- No policies = no access for authenticated/anon. Service-role bypasses RLS.

-- ----------------------------------------------------------------------------
-- SECTION E: Phase 1 RLS (from migration 005)
-- ----------------------------------------------------------------------------

ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspace_select_member ON "Workspace";
CREATE POLICY workspace_select_member ON "Workspace"
  FOR SELECT TO authenticated
  USING (id IN (
    SELECT workspace_id FROM "WorkspaceMember"
    WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
  ));

DROP POLICY IF EXISTS workspace_update_admin ON "Workspace";
CREATE POLICY workspace_update_admin ON "Workspace"
  FOR UPDATE TO authenticated
  USING (id IN (
    SELECT workspace_id FROM "WorkspaceMember"
    WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
      AND role IN ('owner', 'admin')
  ));

DROP POLICY IF EXISTS workspace_delete_owner ON "Workspace";
CREATE POLICY workspace_delete_owner ON "Workspace"
  FOR DELETE TO authenticated
  USING (owner_user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text));

ALTER TABLE "WorkspaceMember" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS wsmember_select_self_or_workspace ON "WorkspaceMember";
CREATE POLICY wsmember_select_self_or_workspace ON "WorkspaceMember"
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
    OR workspace_id IN (
      SELECT workspace_id FROM "WorkspaceMember"
      WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
    )
  );

DROP POLICY IF EXISTS wsmember_insert_admin ON "WorkspaceMember";
CREATE POLICY wsmember_insert_admin ON "WorkspaceMember"
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM "WorkspaceMember"
    WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
      AND role IN ('owner', 'admin')
  ));

DROP POLICY IF EXISTS wsmember_delete_admin_or_self ON "WorkspaceMember";
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

ALTER TABLE "BrandScan" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS bscan_select_workspace_member ON "BrandScan";
CREATE POLICY bscan_select_workspace_member ON "BrandScan"
  FOR SELECT TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM "WorkspaceMember"
    WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
  ));

DROP POLICY IF EXISTS bscan_insert_via_own_xaccount ON "BrandScan";
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

DROP POLICY IF EXISTS bscan_update_owner_or_admin ON "BrandScan";
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

DROP POLICY IF EXISTS bscan_delete_owner_or_admin ON "BrandScan";
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

ALTER TABLE "AuditReportShare" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ars_select_workspace_member ON "AuditReportShare";
CREATE POLICY ars_select_workspace_member ON "AuditReportShare"
  FOR SELECT TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM "WorkspaceMember"
    WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
  ));

DROP POLICY IF EXISTS ars_insert_workspace_member ON "AuditReportShare";
CREATE POLICY ars_insert_workspace_member ON "AuditReportShare"
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by_user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
    AND workspace_id IN (
      SELECT workspace_id FROM "WorkspaceMember"
      WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
    )
  );

DROP POLICY IF EXISTS ars_update_creator ON "AuditReportShare";
CREATE POLICY ars_update_creator ON "AuditReportShare"
  FOR UPDATE TO authenticated
  USING (created_by_user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text));

ALTER TABLE "SecurityAuditLog" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sal_admin_read ON "SecurityAuditLog";
CREATE POLICY sal_admin_read ON "SecurityAuditLog"
  FOR SELECT TO authenticated
  USING ((SELECT role FROM "User" WHERE "supabaseId" = auth.uid()::text) = 'admin');

DROP POLICY IF EXISTS sal_self_read_30d ON "SecurityAuditLog";
CREATE POLICY sal_self_read_30d ON "SecurityAuditLog"
  FOR SELECT TO authenticated
  USING (
    user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
    AND created_at > now() - interval '30 days'
  );

ALTER TABLE "PlanLimit" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plan_limit_public_read ON "PlanLimit";
CREATE POLICY plan_limit_public_read ON "PlanLimit"
  FOR SELECT TO authenticated, anon
  USING (true);

-- brand_scans_public_card view (from 005)
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

GRANT SELECT ON brand_scans_public_card TO anon;
REVOKE ALL ON "BrandScan" FROM anon;
GRANT SELECT ON brand_scans_public_card TO authenticated;

-- Helper function
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

-- ----------------------------------------------------------------------------
-- SECTION F: Opp tables + RLS (from migration 007, not in Prisma schema)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "OppPairings" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  opp_username TEXT NOT NULL,
  score_at_match INTEGER NOT NULL,
  opp_score_at_match INTEGER NOT NULL,
  interaction_score INTEGER NOT NULL DEFAULT 0,
  interaction_data JSONB,
  matched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opp_pairings_username ON "OppPairings" (username);
CREATE INDEX IF NOT EXISTS idx_opp_pairings_expires ON "OppPairings" (expires_at);

CREATE TABLE IF NOT EXISTS "OppMatchups" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_username TEXT NOT NULL,
  user2_username TEXT NOT NULL,
  user1_score INTEGER NOT NULL,
  user2_score INTEGER NOT NULL,
  winner_username TEXT NOT NULL,
  interaction_score INTEGER DEFAULT 0,
  user1_world_id TEXT,
  user2_world_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opp_matchups_user1 ON "OppMatchups" (user1_username);
CREATE INDEX IF NOT EXISTS idx_opp_matchups_user2 ON "OppMatchups" (user2_username);
CREATE INDEX IF NOT EXISTS idx_opp_matchups_created ON "OppMatchups" (created_at DESC);

CREATE TABLE IF NOT EXISTS "OppEmailCaptures" (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT NOT NULL,
  opp_username TEXT NOT NULL,
  user_score INTEGER NOT NULL,
  opp_score INTEGER NOT NULL,
  report_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_opp_emails_email ON "OppEmailCaptures" (email);

ALTER TABLE "OppPairings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OppMatchups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OppEmailCaptures" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anonymous read OppPairings" ON "OppPairings";
DROP POLICY IF EXISTS "Allow anonymous insert OppPairings" ON "OppPairings";
DROP POLICY IF EXISTS "Allow anonymous update OppPairings" ON "OppPairings";
CREATE POLICY "Allow anonymous read OppPairings" ON "OppPairings" FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert OppPairings" ON "OppPairings" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update OppPairings" ON "OppPairings" FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow anonymous read OppMatchups" ON "OppMatchups";
DROP POLICY IF EXISTS "Allow anonymous insert OppMatchups" ON "OppMatchups";
CREATE POLICY "Allow anonymous read OppMatchups" ON "OppMatchups" FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert OppMatchups" ON "OppMatchups" FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anonymous read OppEmailCaptures" ON "OppEmailCaptures";
DROP POLICY IF EXISTS "Allow anonymous insert OppEmailCaptures" ON "OppEmailCaptures";
DROP POLICY IF EXISTS "Allow anonymous update OppEmailCaptures" ON "OppEmailCaptures";
CREATE POLICY "Allow anonymous read OppEmailCaptures" ON "OppEmailCaptures" FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert OppEmailCaptures" ON "OppEmailCaptures" FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update OppEmailCaptures" ON "OppEmailCaptures" FOR UPDATE USING (true);

-- ----------------------------------------------------------------------------
-- SECTION G: CustomWorld RLS (from migration 008)
-- ----------------------------------------------------------------------------

ALTER TABLE "CustomWorld" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customworld_select_member ON "CustomWorld";
CREATE POLICY customworld_select_member ON "CustomWorld"
  FOR SELECT TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM "WorkspaceMember"
    WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
  ));

DROP POLICY IF EXISTS customworld_update_admin ON "CustomWorld";
CREATE POLICY customworld_update_admin ON "CustomWorld"
  FOR UPDATE TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM "WorkspaceMember"
    WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
      AND role IN ('owner', 'admin')
  ));

DROP POLICY IF EXISTS customworld_insert_admin ON "CustomWorld";
CREATE POLICY customworld_insert_admin ON "CustomWorld"
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM "WorkspaceMember"
    WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
      AND role IN ('owner', 'admin')
  ));

DROP POLICY IF EXISTS customworld_delete_owner ON "CustomWorld";
CREATE POLICY customworld_delete_owner ON "CustomWorld"
  FOR DELETE TO authenticated
  USING (workspace_id IN (
    SELECT id FROM "Workspace"
    WHERE owner_user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
  ));
