-- 012: TOS/privacy acknowledgment (Launch Bar Week 3)
-- Records WHEN a user accepted the terms and WHICH version they saw.
-- Additive + idempotent — safe on both staging and prod.

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "tos_accepted_at" timestamptz,
  ADD COLUMN IF NOT EXISTS "tos_version" text;

COMMENT ON COLUMN "User"."tos_accepted_at" IS 'When the user acknowledged TOS+privacy at signup (null = pre-feature account)';
COMMENT ON COLUMN "User"."tos_version" IS 'TOS_VERSION constant the user acknowledged (src/lib/tos.ts)';
