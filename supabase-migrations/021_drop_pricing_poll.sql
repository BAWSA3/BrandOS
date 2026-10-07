-- ============================================================================
-- Migration: drop the unused "would you pay?" pricing poll table
-- Date: 2026-10-06
--
-- The poll from 020 was cut before it ever sent (plan changed: no fixed launch
-- date; 30 days free for every signup, then subscriptions). The table is empty
-- and no code reads or writes it. "EmailSend" from 020 stays.
--
-- Idempotent. Optional cleanup; apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/021_drop_pricing_poll.sql
-- ============================================================================

DROP TABLE IF EXISTS "PricingPollVote";
