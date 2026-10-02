-- ============================================================================
-- Migration: Themed Worlds — workspace-level dashboard theming
-- Date: 2026-04-23
-- Branch: feat/phase-1-account-model
--
-- Adds:
--   1. Workspace.active_world_id + Workspace.custom_world_id  (world selection)
--   2. CustomWorld table                                      (paid-tier custom builder output)
--   3. PlanLimit.custom_world_builder_enabled + premium_worlds_enabled  (tier gates)
--   4. AuditReportShare.world_id_at_share                     (snapshot at share time)
--   5. OppMatchups.user1_world_id + user2_world_id           (carry-forward on public opp pages)
--
-- Apply order: 004 → 005 → 006 → 007 → 008 (this).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Workspace — world selection columns
-- ----------------------------------------------------------------------------

ALTER TABLE "Workspace"
  ADD COLUMN IF NOT EXISTS active_world_id TEXT,
  ADD COLUMN IF NOT EXISTS custom_world_id UUID;

-- ----------------------------------------------------------------------------
-- 2. CustomWorld — paid-tier builder output, one per workspace
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "CustomWorld" (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id   UUID        NOT NULL UNIQUE REFERENCES "Workspace"(id) ON DELETE CASCADE,
  base_world_id  TEXT        NOT NULL,
  manifest       JSONB       NOT NULL DEFAULT '{}'::jsonb,
  name           TEXT        NOT NULL DEFAULT 'My World',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_world_workspace ON "CustomWorld" (workspace_id);

-- FK from Workspace.custom_world_id → CustomWorld.id (nullable; SET NULL on delete
-- since CustomWorld cascade-deletes from Workspace anyway, this just keeps the
-- column consistent if a custom world is deleted without removing the workspace).
-- (ADD CONSTRAINT has no IF NOT EXISTS in Postgres — guard via pg_constraint)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workspace_custom_world_fkey') THEN
    ALTER TABLE "Workspace"
      ADD CONSTRAINT workspace_custom_world_fkey
      FOREIGN KEY (custom_world_id) REFERENCES "CustomWorld"(id) ON DELETE SET NULL;
  END IF;
END $$;

-- RLS — mirrors 005 policies for workspace-scoped rows
ALTER TABLE "CustomWorld" ENABLE ROW LEVEL SECURITY;

CREATE POLICY customworld_select_member ON "CustomWorld"
  FOR SELECT TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM "WorkspaceMember"
    WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
  ));

CREATE POLICY customworld_update_admin ON "CustomWorld"
  FOR UPDATE TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM "WorkspaceMember"
    WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
      AND role IN ('owner', 'admin')
  ));

CREATE POLICY customworld_insert_admin ON "CustomWorld"
  FOR INSERT TO authenticated
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM "WorkspaceMember"
    WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
      AND role IN ('owner', 'admin')
  ));

CREATE POLICY customworld_delete_owner ON "CustomWorld"
  FOR DELETE TO authenticated
  USING (workspace_id IN (
    SELECT id FROM "Workspace"
    WHERE owner_user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
  ));

-- ----------------------------------------------------------------------------
-- 3. PlanLimit — tier gates for worlds
-- ----------------------------------------------------------------------------

ALTER TABLE "PlanLimit"
  ADD COLUMN IF NOT EXISTS custom_world_builder_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS premium_worlds_enabled       BOOLEAN NOT NULL DEFAULT FALSE;

-- Seed defaults per tier.
-- FREE: only free-tier starter worlds, no builder
-- PRO: premium starter worlds unlocked, no builder
-- MAX / TEAM / ENTERPRISE: builder + premium starter worlds
UPDATE "PlanLimit" SET premium_worlds_enabled = FALSE, custom_world_builder_enabled = FALSE WHERE plan = 'FREE';
UPDATE "PlanLimit" SET premium_worlds_enabled = TRUE,  custom_world_builder_enabled = FALSE WHERE plan = 'PRO';
UPDATE "PlanLimit" SET premium_worlds_enabled = TRUE,  custom_world_builder_enabled = TRUE  WHERE plan IN ('MAX', 'TEAM', 'ENTERPRISE');

-- ----------------------------------------------------------------------------
-- 4. AuditReportShare — snapshot world id at share creation time
-- ----------------------------------------------------------------------------

ALTER TABLE "AuditReportShare"
  ADD COLUMN IF NOT EXISTS world_id_at_share TEXT;

-- ----------------------------------------------------------------------------
-- 5. OppMatchups — carry each side's world into the public opp page
-- ----------------------------------------------------------------------------

ALTER TABLE "OppMatchups"
  ADD COLUMN IF NOT EXISTS user1_world_id TEXT,
  ADD COLUMN IF NOT EXISTS user2_world_id TEXT;
