-- 014: Tie Brand to Workspace (split-brain consolidation step 2)
--
-- Adds workspace scoping to the legacy Brand table so /app's rescued
-- features live on the Phase 1 workspace model. Nullable FK: legacy rows
-- are backfilled to the owner's personal workspace below; anything left
-- (owner has no personal workspace yet) is adopted on first authed read
-- by /api/brands.

ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "workspaceId" uuid;

-- ADD CONSTRAINT IF NOT EXISTS is invalid PG syntax — guard via pg_constraint
-- (lesson from migration 008).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Brand_workspaceId_fkey'
  ) THEN
    ALTER TABLE "Brand"
      ADD CONSTRAINT "Brand_workspaceId_fkey"
      FOREIGN KEY ("workspaceId") REFERENCES "Workspace"(id)
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Brand_workspaceId_idx" ON "Brand"("workspaceId");

-- Backfill: attach existing brands to their owner's personal workspace.
UPDATE "Brand" b
SET "workspaceId" = w.id
FROM "Workspace" w
WHERE b."workspaceId" IS NULL
  AND w.owner_user_id = b."userId"
  AND w.type = 'personal';
