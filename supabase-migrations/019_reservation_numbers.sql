-- ============================================================================
-- Migration: permanent reservation numbers ("Station #0142")
-- Date: 2026-10-05
--
-- The flex sign shows each reserver's station number, and reservations
-- #1-250 get first access to the 250 Founding Member spots on Oct 20, so the
-- number must be permanent: assigned once, in reservation order. Until now
-- the API returned a live count, which isn't a stable per-person number.
--
-- Idempotent. Backfills anyone who already reserved (ordered by reservedAt),
-- then points the sequence past the highest number. Apply to staging, then
-- prod, BEFORE merging the code that uses it.
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS "EmailSignup_reservationNumber_seq";

ALTER TABLE "EmailSignup" ADD COLUMN IF NOT EXISTS "reservationNumber" INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS "EmailSignup_reservationNumber_key"
  ON "EmailSignup" ("reservationNumber");

CREATE INDEX IF NOT EXISTS "EmailSignup_xUsername_reserved_idx"
  ON "EmailSignup" ("xUsername") WHERE "reservedAt" IS NOT NULL;

WITH ordered AS (
  SELECT id,
         row_number() OVER (ORDER BY "reservedAt", id)
           + COALESCE((SELECT max("reservationNumber") FROM "EmailSignup"), 0) AS n
  FROM "EmailSignup"
  WHERE "reservedAt" IS NOT NULL AND "reservationNumber" IS NULL
)
UPDATE "EmailSignup" e SET "reservationNumber" = o.n FROM ordered o WHERE e.id = o.id;

SELECT setval(
  '"EmailSignup_reservationNumber_seq"',
  GREATEST(COALESCE((SELECT max("reservationNumber") FROM "EmailSignup"), 0), 1),
  (SELECT max("reservationNumber") FROM "EmailSignup") IS NOT NULL
);
