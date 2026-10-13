-- ============================================================================
-- Migration: "ApiUsageLog" for the public API v1 (optional, not a launch blocker)
-- Date: 2026-10-12
--
-- src/lib/api-auth.ts logs every /api/v1 call to "ApiUsageLog" (and
-- /api/v1/usage reads it), but the table was never created on prod: the
-- insert is fire-and-forget with .catch(), so usage logging has been failing
-- quietly. Staging has it (Prisma baseline). Same shape as the Prisma model.
--
-- RLS on, no policies, anon/authenticated revoked: server-only via Prisma
-- (same pattern as 022, which already lists this table).
--
-- Idempotent. Prod only needs it (staging already has it; this is a no-op there):
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/032_api_usage_log.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "ApiUsageLog" (
  "id"         TEXT NOT NULL,
  "endpoint"   TEXT NOT NULL,
  "method"     TEXT NOT NULL,
  "statusCode" INTEGER NOT NULL,
  "latencyMs"  INTEGER NOT NULL,
  "username"   TEXT,
  "metadata"   TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "apiKeyId"   TEXT NOT NULL,
  CONSTRAINT "ApiUsageLog_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "ApiUsageLog_apiKeyId_idx" ON "ApiUsageLog" ("apiKeyId");
CREATE INDEX IF NOT EXISTS "ApiUsageLog_apiKeyId_createdAt_idx" ON "ApiUsageLog" ("apiKeyId", "createdAt");
CREATE INDEX IF NOT EXISTS "ApiUsageLog_createdAt_idx" ON "ApiUsageLog" ("createdAt");
CREATE INDEX IF NOT EXISTS "ApiUsageLog_endpoint_idx" ON "ApiUsageLog" ("endpoint");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ApiUsageLog_apiKeyId_fkey') THEN
    ALTER TABLE "ApiUsageLog"
      ADD CONSTRAINT "ApiUsageLog_apiKeyId_fkey" FOREIGN KEY ("apiKeyId")
      REFERENCES "ApiKey"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE public."ApiUsageLog" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."ApiUsageLog" FROM anon, authenticated;
