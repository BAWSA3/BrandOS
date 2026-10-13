-- ============================================================================
-- Migration: "McpUsage" — metered uses of the BrandOS MCP (Claude / ChatGPT)
-- Date: 2026-10-13
--
-- One row per counted MCP tool use by a signed-in BrandOS user. Free plan:
-- 10 uses per calendar week (Mon 00:00 UTC). Unlimited: the first 30 days
-- after signup, and active paid subscriptions. Only uses that do fresh work
-- are recorded (cache hits, posts already on the dashboard, failures: free).
--
-- RLS on, NO policies; anon/authenticated revoked. Server-only via Prisma
-- (same pattern as 020/022-033).
--
-- Idempotent. Requires 004 ("User"). Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/034_mcp_usage.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "McpUsage" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "tool"      TEXT NOT NULL CHECK (char_length("tool") BETWEEN 1 AND 40),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "McpUsage_userId_createdAt_idx" ON "McpUsage" ("userId", "createdAt" DESC);

ALTER TABLE public."McpUsage" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."McpUsage" FROM anon, authenticated;
