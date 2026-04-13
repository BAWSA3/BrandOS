-- ============================================================================
-- Migration: Phase 1 — Account model + workspaces + scan ownership
-- Date: 2026-04-13
-- Branch: feat/phase-1-account-model
-- Reference: docs/PHASE-1-SCHEMA.md, docs/SECURITY-HARDENING.md
--
-- This migration is PURELY ADDITIVE. It creates new tables and adds new
-- columns to existing tables. It does NOT drop or rename anything. Running
-- application code (which still reads/writes legacy "BrandScans" and "Team"
-- tables) continues to work after this migration applies.
--
-- Cleanup of legacy tables happens in a future migration (007+) once
-- application code is migrated to the new schema.
--
-- Apply order: 004 (this) → 005 (RLS) → application code rollout → 007 cleanup.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enums
-- ----------------------------------------------------------------------------

CREATE TYPE plan_tier AS ENUM ('FREE', 'PRO', 'MAX', 'TEAM', 'ENTERPRISE');

CREATE TYPE workspace_type AS ENUM ('personal', 'team');

CREATE TYPE workspace_role AS ENUM ('owner', 'admin', 'member');

CREATE TYPE connected_account_status AS ENUM ('active', 'dormant');

CREATE TYPE scan_visibility AS ENUM ('private', 'card_public');

CREATE TYPE scan_status AS ENUM ('active', 'dormant', 'archived');

CREATE TYPE audit_event_category AS ENUM ('auth', 'scan', 'payment', 'security', 'account');

CREATE TYPE user_role AS ENUM ('user', 'admin');

CREATE TYPE migration_status AS ENUM ('legacy', 'in_progress', 'completed');

-- ----------------------------------------------------------------------------
-- 2. User table — additive columns only
--
-- We add role + migration_status without touching existing columns.
-- Subscription columns (stripeCustomerId, subscriptionTier, etc.) stay on User
-- for now and will be dropped in migration 007 after Workspace billing is live.
-- ----------------------------------------------------------------------------

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS role user_role NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS account_migration_status migration_status NOT NULL DEFAULT 'legacy';

CREATE INDEX IF NOT EXISTS user_role_admin_idx
  ON "User"(role) WHERE role = 'admin';

CREATE INDEX IF NOT EXISTS user_migration_status_idx
  ON "User"(account_migration_status) WHERE account_migration_status != 'completed';

-- ----------------------------------------------------------------------------
-- 3. Workspace
-- ----------------------------------------------------------------------------

CREATE TABLE "Workspace" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type workspace_type NOT NULL,
  owner_user_id text NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  plan plan_tier NOT NULL DEFAULT 'FREE',
  seat_count integer NOT NULL DEFAULT 1 CHECK (seat_count >= 1),
  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  trial_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT personal_must_have_one_seat
    CHECK (type != 'personal' OR seat_count = 1),
  CONSTRAINT team_min_5_seats
    CHECK (type != 'team' OR seat_count >= 5)
);

CREATE INDEX workspace_owner_idx ON "Workspace"(owner_user_id);
CREATE UNIQUE INDEX one_personal_per_user
  ON "Workspace"(owner_user_id) WHERE type = 'personal';

-- ----------------------------------------------------------------------------
-- 4. WorkspaceMember
-- ----------------------------------------------------------------------------

CREATE TABLE "WorkspaceMember" (
  workspace_id uuid NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  role workspace_role NOT NULL DEFAULT 'member',
  invited_by_user_id text REFERENCES "User"(id),
  joined_at timestamptz NOT NULL DEFAULT now(),

  PRIMARY KEY (workspace_id, user_id)
);

CREATE INDEX wsmember_user_idx ON "WorkspaceMember"(user_id);

-- ----------------------------------------------------------------------------
-- 5. PlatformConnection — extend with workspace + encryption fields
--
-- Reuses existing PlatformConnection table from prisma/schema.prisma:246-267.
-- For Phase 1 we treat this as the X-account connection store (multi-platform
-- ships in Q2 against the same table).
--
-- New columns (all additive):
--   workspace_id      — which workspace this connection counts toward
--   status            — active | dormant (soft-archive on disconnect)
--   key_id            — encryption key version (envelope encryption pattern)
--   access_token_ciphertext, refresh_token_ciphertext — replace plaintext token
--   columns over time. Both old and new columns coexist during transition.
-- ----------------------------------------------------------------------------

ALTER TABLE "PlatformConnection"
  ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES "Workspace"(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status connected_account_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS key_id text NOT NULL DEFAULT 'v1',
  ADD COLUMN IF NOT EXISTS access_token_ciphertext text,
  ADD COLUMN IF NOT EXISTS refresh_token_ciphertext text,
  ADD COLUMN IF NOT EXISTS disconnected_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS platconn_workspace_active_idx
  ON "PlatformConnection"(workspace_id) WHERE status = 'active';

-- Unique constraint: same X account can only be connected once per workspace.
-- Use partial unique to avoid conflicts on multi-platform rows.
CREATE UNIQUE INDEX IF NOT EXISTS platconn_x_per_workspace_unique
  ON "PlatformConnection"(workspace_id, "platformUserId")
  WHERE platform = 'x' AND workspace_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 6. PlanLimit — feature gates and capacity caps per tier
-- ----------------------------------------------------------------------------

CREATE TABLE "PlanLimit" (
  plan plan_tier PRIMARY KEY,
  scans_per_day integer NOT NULL,
  x_accounts_per_seat integer NOT NULL,
  multi_platform_enabled boolean NOT NULL DEFAULT false,
  competitor_watchlist_enabled boolean NOT NULL DEFAULT false,
  scheduled_rescans_enabled boolean NOT NULL DEFAULT false,
  priority_queue_enabled boolean NOT NULL DEFAULT false,
  max_flagged_tweets integer NOT NULL DEFAULT 3,
  audit_summary_max_chars integer NOT NULL DEFAULT 800,
  max_strengths integer NOT NULL DEFAULT 3,
  max_improvements integer NOT NULL DEFAULT 3
);

INSERT INTO "PlanLimit" VALUES
  -- plan,         scans, x/seat, multi, watch, resched, prio, flagged, summChars, strengths, improvements
  ('FREE',         1,     1,      false, false, false,   false, 3,       800,       3,         3),
  ('PRO',          20,    3,      true,  true,  true,    false, 5,       1200,      5,         5),
  ('MAX',          100,   5,      true,  true,  true,    true,  10,      2000,      7,         7),
  ('TEAM',         20,    3,      true,  true,  true,    false, 5,       1200,      5,         5),
  ('ENTERPRISE',   9999,  999,    true,  true,  true,    true,  20,      4000,      10,        10);

-- ----------------------------------------------------------------------------
-- 7. BrandScan — new owned-scan table (distinct from legacy BrandScans)
--
-- Singular name "BrandScan" disambiguates from legacy plural "BrandScans"
-- which still exists during transition. Application code is updated to write
-- to BrandScan; legacy BrandScans keeps working until cleanup migration 007.
-- ----------------------------------------------------------------------------

CREATE TABLE "BrandScan" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  workspace_id uuid NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  platform_connection_id text NOT NULL REFERENCES "PlatformConnection"(id) ON DELETE RESTRICT,
  x_username text NOT NULL,

  -- Analysis output (Zod-validated at app layer per Phase 4 hardening)
  score integer NOT NULL CHECK (score BETWEEN 0 AND 100),
  archetype text NOT NULL,
  phase_scores jsonb NOT NULL,
  strengths jsonb NOT NULL,
  improvements jsonb NOT NULL,
  insights jsonb,
  summary text,
  influence_tier text,
  next_moves jsonb,
  content_pillars jsonb,

  visibility scan_visibility NOT NULL DEFAULT 'card_public',
  status scan_status NOT NULL DEFAULT 'active',
  scanned_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX bscan_user_idx ON "BrandScan"(user_id);
CREATE INDEX bscan_workspace_idx ON "BrandScan"(workspace_id);
CREATE INDEX bscan_platconn_idx ON "BrandScan"(platform_connection_id);
CREATE INDEX bscan_xusername_active_idx
  ON "BrandScan"(x_username, scanned_at DESC) WHERE status = 'active';
CREATE INDEX bscan_card_public_idx
  ON "BrandScan"(x_username) WHERE visibility = 'card_public' AND status = 'active';

-- ----------------------------------------------------------------------------
-- 8. AuditReportShare — signed-URL audit report sharing
-- ----------------------------------------------------------------------------

CREATE TABLE "AuditReportShare" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- audit_report_id text NOT NULL REFERENCES "AuditReport"(id) ON DELETE CASCADE,
  -- ^ AuditReport table not yet created (still under audit/run/route.ts result shape).
  --   FK added when AuditReport table lands. For now we reference scan via brand_scan_id.
  brand_scan_id uuid REFERENCES "BrandScan"(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,
  created_by_user_id text NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  view_count integer NOT NULL DEFAULT 0,
  unique_viewer_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ars_token_idx ON "AuditReportShare"(token);
CREATE INDEX ars_active_idx ON "AuditReportShare"(brand_scan_id) WHERE revoked_at IS NULL;
CREATE INDEX ars_workspace_idx ON "AuditReportShare"(workspace_id);

CREATE TABLE "AuditReportShareView" (
  share_id uuid NOT NULL REFERENCES "AuditReportShare"(id) ON DELETE CASCADE,
  ip_hash text NOT NULL,
  first_viewed_at timestamptz NOT NULL DEFAULT now(),
  last_viewed_at timestamptz NOT NULL DEFAULT now(),
  view_count integer NOT NULL DEFAULT 1,
  PRIMARY KEY (share_id, ip_hash)
);

-- ----------------------------------------------------------------------------
-- 9. SecurityAuditLog — admin audit log + personal activity log source
-- ----------------------------------------------------------------------------

CREATE TABLE "SecurityAuditLog" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category audit_event_category NOT NULL,
  event_type text NOT NULL,
  user_id text REFERENCES "User"(id) ON DELETE SET NULL,
  workspace_id uuid REFERENCES "Workspace"(id) ON DELETE SET NULL,
  success boolean NOT NULL DEFAULT true,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_hash text,
  user_agent_family text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sal_user_created_idx
  ON "SecurityAuditLog"(user_id, created_at DESC);
CREATE INDEX sal_workspace_created_idx
  ON "SecurityAuditLog"(workspace_id, created_at DESC);
CREATE INDEX sal_category_created_idx
  ON "SecurityAuditLog"(category, created_at DESC);
CREATE INDEX sal_purge_idx ON "SecurityAuditLog"(created_at);

-- ----------------------------------------------------------------------------
-- 10. updated_at triggers (matches Postgres convention)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspace_updated_at
  BEFORE UPDATE ON "Workspace"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- End of 004_phase1_account_model.sql
-- Next: 005_phase1_rls_policies.sql
-- ============================================================================
