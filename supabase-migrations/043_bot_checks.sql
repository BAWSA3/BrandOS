-- ============================================================================
-- Migration: "BotCheck" — "How many bots follow you?" (/bots)
-- Date: 2026-10-23
--
-- One cached result per handle (lowercase), refreshed after 7 days. "record"
-- is the check: counts and % real for the newest ~200 followers and for the
-- people who engage, notable engagers, and the flagged accounts (served only
-- to the handle's owner, signed in with that X account). "checkedAt" also
-- drives the global daily budget (fresh checks per UTC day).
--
-- New table: the app works before this is applied (checks run uncached, the
-- daily budget falls back to a per-instance counter).
--
-- RLS on, NO policies; anon/authenticated revoked. Server-only via Prisma.
-- Idempotent. Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/043_bot_checks.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "BotCheck" (
  "handle"    TEXT PRIMARY KEY CHECK ("handle" = lower("handle") AND "handle" ~ '^[a-z0-9_]{1,15}$'),
  "xUserId"   TEXT NOT NULL CHECK ("xUserId" ~ '^[0-9]{1,25}$'),
  "record"    JSONB NOT NULL,
  "checkedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "BotCheck_checkedAt_idx" ON "BotCheck" ("checkedAt");

ALTER TABLE public."BotCheck" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."BotCheck" FROM anon, authenticated;
