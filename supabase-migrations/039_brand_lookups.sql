-- ============================================================================
-- Migration: "BrandLookup" + "LookupDigest" — "your brand was looked up"
-- Date: 2026-10-21
--
-- Retention loop (docs/LAUNCH-PLAN.md, retention thesis): creators see how
-- often their brand is checked — public /@handle views, Claude/ChatGPT (MCP)
-- lookups and compares. Counts and type only; identities are never shown.
--
-- BrandLookup: one row per (handle, kind, viewer, UTC day), so refreshes and
--   repeat visits don't inflate the count. viewerKey is a user id or a salted
--   hash of the visitor (dedupe only, never displayed). Owners viewing their
--   own page are not recorded.
-- LookupDigest: one row per (user, week) — the weekly email's send claim, so a
--   retried cron never double-sends.
--
-- Separate tables: the app keeps working before this is applied (counts read
-- as 0, recording is skipped, the digest sends nothing).
--
-- RLS on, NO policies; anon/authenticated revoked. Server-only via Prisma.
-- Idempotent. Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/039_brand_lookups.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "BrandLookup" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "handle"    TEXT NOT NULL CHECK ("handle" = lower("handle") AND char_length("handle") BETWEEN 1 AND 20),
  "kind"      TEXT NOT NULL CHECK ("kind" IN ('page', 'mcp', 'compare')),
  "viewerKey" TEXT NOT NULL CHECK (char_length("viewerKey") <= 80),
  "day"       DATE NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("handle", "kind", "viewerKey", "day")
);
CREATE INDEX IF NOT EXISTS "BrandLookup_handle_createdAt_idx" ON "BrandLookup" ("handle", "createdAt" DESC);

CREATE TABLE IF NOT EXISTS "LookupDigest" (
  "userId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "week"      DATE NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY ("userId", "week")
);

ALTER TABLE public."BrandLookup" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."LookupDigest" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."BrandLookup" FROM anon, authenticated;
REVOKE ALL ON TABLE public."LookupDigest" FROM anon, authenticated;
