-- ============================================================================
-- Migration: link API keys to the user who owns them (BrandOS MCP v1)
-- Date: 2026-10-08
--
-- Self-serve keys let a signed-in user connect their AI tools to BrandOS: the
-- MCP's get_brand_context / check_draft load that user's brand. Admin-issued
-- partner keys keep userId NULL and only reach public data (scores).
--
-- Also locks "ApiKey" down like the other server-only tables (RLS on, no
-- policies, anon/authenticated revoked); the app reaches it only through the
-- service-role Prisma client. Idempotent. Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/029_api_key_owner.sql
-- ============================================================================

ALTER TABLE "ApiKey"
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "workspaceId" TEXT;

CREATE INDEX IF NOT EXISTS "ApiKey_userId_idx" ON "ApiKey" ("userId");

ALTER TABLE public."ApiKey" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."ApiKey" FROM anon, authenticated;
