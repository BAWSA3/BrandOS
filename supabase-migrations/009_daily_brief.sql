-- ============================================================================
-- Migration: DailyBrief — daily creator brief (1 idea, 1 metric, 1 action)
-- Date: 2026-06-15
-- Branch: staging
--
-- One brief per user per UTC date. Generated lazily on first /today visit of
-- the day from the user's most recent BrandScan (archetype + weakest phase).
-- Mark-done updates completed_at; streak count is derived from contiguous
-- prior days where completed_at is non-null.
--
-- RLS: select/update restricted to workspace members; insert via service-role
-- only (writes happen from the /today route after auth checks).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table
-- ----------------------------------------------------------------------------

CREATE TABLE "DailyBrief" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES "Workspace"(id) ON DELETE CASCADE,

  brief_date date NOT NULL,
  source_brand_scan_id uuid REFERENCES "BrandScan"(id) ON DELETE SET NULL,

  archetype text NOT NULL,
  score_at_generation integer NOT NULL CHECK (score_at_generation BETWEEN 0 AND 100),
  weakest_phase text NOT NULL,
  weakest_phase_score integer NOT NULL CHECK (weakest_phase_score BETWEEN 0 AND 100),

  idea text NOT NULL,
  action text NOT NULL,

  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, brief_date)
);

CREATE INDEX dbrief_user_date_idx
  ON "DailyBrief"(user_id, brief_date DESC);
CREATE INDEX dbrief_workspace_idx
  ON "DailyBrief"(workspace_id);
CREATE INDEX dbrief_user_completed_idx
  ON "DailyBrief"(user_id, brief_date DESC) WHERE completed_at IS NOT NULL;

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------

ALTER TABLE "DailyBrief" ENABLE ROW LEVEL SECURITY;

-- Members of the brief's workspace may read it
CREATE POLICY dbrief_select_workspace_member ON "DailyBrief"
  FOR SELECT TO authenticated
  USING (workspace_id IN (
    SELECT workspace_id FROM "WorkspaceMember"
    WHERE user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text)
  ));

-- Only the owner can mark their own brief done (or undo)
CREATE POLICY dbrief_update_owner ON "DailyBrief"
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text))
  WITH CHECK (user_id = (SELECT id FROM "User" WHERE "supabaseId" = auth.uid()::text));

-- INSERT/DELETE: service-role only. The /today route writes via the admin
-- client after verifying ownership in application code.

-- Lock down anon entirely
REVOKE ALL ON "DailyBrief" FROM anon;

-- ============================================================================
-- End of 009_daily_brief.sql
-- ============================================================================
