-- ============================================================================
-- Migration: idea board per brand ("Idea", from 035)
-- Date: 2026-10-23
--
-- Growth dashboard idea board (pivot 2026-10-22): each tracked brand has its
-- own board; ideas come from the user (the blank page) or from BrandOS (AI
-- ideas generated from that brand's analytics), and move Ideas → Drafting →
-- Posted.
--
-- "accountId": the TrackedAccount (brand) the idea belongs to (null = the old
--   per-user studio board).
-- "source": 'mine' (written on the blank page) | 'brandos' (generated).
-- status: adds 'drafting' (saved = the Ideas column).
-- "suggestion": raised to 2000 chars (an idea written on the blank page can be
--   a full draft; was 300).
--
-- Additive (no data changes; the table is empty on staging and prod). The app
-- works before this is applied (the board stays local-only).
-- RLS was already on with no policies (035). Idempotent. Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/042_idea_board_brands.sql
-- ============================================================================

ALTER TABLE "Idea" ADD COLUMN IF NOT EXISTS "accountId" TEXT REFERENCES "TrackedAccount"("id") ON DELETE CASCADE;
ALTER TABLE "Idea" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'mine';

ALTER TABLE "Idea" DROP CONSTRAINT IF EXISTS "Idea_source_check";
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_source_check" CHECK ("source" IN ('mine', 'brandos'));

ALTER TABLE "Idea" DROP CONSTRAINT IF EXISTS "Idea_status_check";
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_status_check" CHECK ("status" IN ('saved', 'drafting', 'posted'));

ALTER TABLE "Idea" DROP CONSTRAINT IF EXISTS "Idea_suggestion_check";
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_suggestion_check" CHECK (char_length("suggestion") <= 2000);

CREATE INDEX IF NOT EXISTS "Idea_account_createdAt_idx" ON "Idea" ("accountId", "createdAt" DESC);

ALTER TABLE public."Idea" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."Idea" FROM anon, authenticated;
