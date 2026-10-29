-- ============================================================================
-- Migration: invite-only trial (apply list + member invites)
-- Date: 2026-10-28
--
-- The invite-only trial (Bawsa, Oct 28; on from the Nov 2 launch):
--   1. "AccessApplication": the public "apply for a code" form. Bawsa approves
--      in batches with scripts/invite-codes.ts (applicants / approve), which
--      mints a code and links it here.
--   2. EarlyAccessCode."createdByUserId": codes a member made from their
--      dashboard (up to 3 each). NULL = made by Bawsa with the admin script.
--   3. EarlyAccessCode."reservedHandle": the code minted for an Index
--      reservation (scripts/invite-codes.ts reserve-codes), one per
--      reservation; UNIQUE so a re-run never mints twice. The Nov 2 Index
--      email carries it (sign-up is invite-only from launch).
-- Nothing existing changes meaning. The app no-ops (form says "try again",
-- the invite spot hides) until this is applied.
-- ============================================================================

CREATE TABLE IF NOT EXISTS "AccessApplication" (
  "id"         TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  "handle"     TEXT NOT NULL UNIQUE CHECK ("handle" ~ '^[a-z0-9_]{1,15}$'),
  "email"      TEXT NOT NULL CHECK (length("email") BETWEEN 3 AND 254),
  "note"       TEXT CHECK ("note" IS NULL OR length("note") <= 280),
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  "approvedAt" TIMESTAMPTZ,
  "codeId"     TEXT UNIQUE REFERENCES "EarlyAccessCode"("id") ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS "AccessApplication_createdAt_idx"
  ON "AccessApplication" ("createdAt" DESC);

ALTER TABLE "EarlyAccessCode"
  ADD COLUMN IF NOT EXISTS "createdByUserId" TEXT REFERENCES "User"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "EarlyAccessCode_createdByUserId_idx"
  ON "EarlyAccessCode" ("createdByUserId");
ALTER TABLE "EarlyAccessCode"
  ADD COLUMN IF NOT EXISTS "reservedHandle" TEXT UNIQUE
  CHECK ("reservedHandle" IS NULL OR "reservedHandle" ~ '^[a-z0-9_]{1,15}$');

-- Server-only, same as EarlyAccessCode (Prisma via the service connection).
ALTER TABLE public."AccessApplication" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."AccessApplication" FROM anon, authenticated;
