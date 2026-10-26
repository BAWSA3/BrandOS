-- ============================================================================
-- Migration: past brand deals on a Creator Index entry ("IndexDeal")
-- Date: 2026-10-23
--
-- docs/GTM-OPERATING-PLAN.md, "Changes from market research" #5: the track
-- record starts at join. Trust ("is this account real, will they deliver?") is
-- the strongest demand signal in docs/research/2026-10-23-demand.md, and a
-- record of who delivered for whom is the part competitors can't copy later.
--
-- "IndexDeal": a past brand deal a member logged themselves (up to 10 each,
--   enforced in src/lib/index-deals.ts).
--   "brand"        the brand's name as the member typed it (one line, ≤60)
--   "brandHandle"  the brand's X handle, lowercase, optional
--   "dealMonth"    first day of the month it ran, optional
--   "postUrl"      the deal post, an x.com status link only, optional
--   "confirmedAt"  set when the brand confirms it (next step, Nov 12); until
--                  then a deal is PRIVATE to the member and never shown to
--                  anyone else
--
-- New table only: the app works before this is applied (reads fall back to
-- an empty list, writes return a plain "not open yet" error).
--
-- RLS on, NO policies; anon/authenticated revoked. Server-only via Prisma.
-- Idempotent. Requires 044. Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/046_index_deals.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "IndexDeal" (
  "id"          TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  "entryId"     TEXT NOT NULL REFERENCES "IndexEntry"("id") ON DELETE CASCADE,
  "brand"       TEXT NOT NULL CHECK (char_length("brand") BETWEEN 1 AND 60),
  "brandHandle" TEXT CHECK ("brandHandle" = lower("brandHandle") AND "brandHandle" ~ '^[a-z0-9_]{1,15}$'),
  "dealMonth"   DATE CHECK (EXTRACT(DAY FROM "dealMonth") = 1),
  "postUrl"     TEXT CHECK ("postUrl" ~ '^https://x\.com/[A-Za-z0-9_]{1,15}/status/[0-9]{1,25}$'),
  "confirmedAt" TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "IndexDeal_entry_createdAt_idx" ON "IndexDeal" ("entryId", "createdAt" DESC);

ALTER TABLE public."IndexDeal" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."IndexDeal" FROM anon, authenticated;
