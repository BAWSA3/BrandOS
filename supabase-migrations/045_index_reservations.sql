-- ============================================================================
-- Migration: reserved Creator Index numbers ("IndexReservation")
-- Date: 2026-10-23
--
-- Decided with Bawsa on Oct 23: everyone on the email list who gave their X
-- handle gets a RESERVED Index number before launch, in signup order. A
-- reservation is private (never listed, never shown to anyone but the handle's
-- owner) until it's claimed by signing in with X as that handle, which goes
-- through the normal join and keeps the number.
--
-- Numbers: @jbawsa is No. 0000 (founder); the 28 station reservations
-- ("EmailSignup"."reservationNumber" 1-28) keep their exact number; everyone
-- else follows from 29 in signup order. scripts/reserve-index-numbers.mjs
-- assigns them (dry run by default) and moves "IndexEntry_number_seq" above
-- every reserved number, so a join without a reservation gets the next free
-- number and never a reserved one.
--
-- "IndexReservation": one per reserved handle (lowercase).
--   "number"       the reserved Index number (unique; 0 allowed for the founder)
--   "source"       founder | station | email | account
--   "emailSignupId" the "EmailSignup" row it came from, if any
--   "claimedAt" / "claimedByUserId"  set when the owner joins with it
--   "releaseAt"    when an unclaimed reservation may be released (Dec 3);
--                  nothing releases automatically yet
-- "IndexEntry"."number" may now be 0 (the founder): the SERIAL default stays,
-- explicit numbers come from reservations.
--
-- New table + a check constraint: the app works before this is applied (joins
-- fall back to the next free number, the header shows members only).
--
-- RLS on, NO policies; anon/authenticated revoked. Server-only via Prisma.
-- Idempotent. Requires 044. Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/045_index_reservations.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "IndexReservation" (
  "handle"          TEXT PRIMARY KEY CHECK ("handle" = lower("handle") AND "handle" ~ '^[a-z0-9_]{1,15}$'),
  "number"          INTEGER NOT NULL UNIQUE CHECK ("number" >= 0),
  "source"          TEXT NOT NULL CHECK ("source" IN ('founder', 'station', 'email', 'account')),
  "emailSignupId"   TEXT,
  "reservedAt"      TIMESTAMPTZ NOT NULL DEFAULT now(),
  "releaseAt"       TIMESTAMPTZ,
  "claimedAt"       TIMESTAMPTZ,
  "claimedByUserId" TEXT REFERENCES "User"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "IndexReservation_claimedAt_idx" ON "IndexReservation" ("claimedAt");

ALTER TABLE "IndexEntry" DROP CONSTRAINT IF EXISTS "IndexEntry_number_check";
ALTER TABLE "IndexEntry" ADD CONSTRAINT "IndexEntry_number_check" CHECK ("number" >= 0);

ALTER TABLE public."IndexReservation" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."IndexReservation" FROM anon, authenticated;
