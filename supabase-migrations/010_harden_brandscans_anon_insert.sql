-- ============================================================================
-- Migration: Harden legacy "BrandScans" anon INSERT (anti score-poisoning)
-- Date: 2026-06-18
-- Reference: docs/MINIMUM-LAUNCH-BAR.md (Phase 1 data isolation), HANDOFF.md
--
-- Context: the legacy plural "BrandScans" table is still written by the public
-- scan flow via the anon key (src/lib/scan-tracking.ts) and migration 002 left
-- its anon INSERT policy as `WITH CHECK (true)` — i.e. anyone holding the anon
-- key (which ships in the browser bundle) can insert ARBITRARY score rows.
-- That is the "score poisoning" vector: fake high scores pollute the
-- leaderboard / stats / cohort reports.
--
-- The full fix (route recording through a server endpoint with a service-role
-- insert + validation, then revoke anon entirely) is deferred to the
-- BrandScans -> BrandScan cutover planned alongside the gated-funnel / BotID
-- work. THIS migration is the cheap interim guard: keep anon INSERT working
-- (so scan recording doesn't break — see migration 002's warning) but constrain
-- it to sane values so the crudest poisoning is rejected at the database.
--
-- Reads stay open: BrandScans holds only public username + score + archetype
-- (no PII), already surfaced on the public leaderboard/card.
-- ============================================================================

DROP POLICY IF EXISTS "Allow anonymous inserts" ON "BrandScans";

CREATE POLICY "Allow anonymous inserts" ON "BrandScans"
  FOR INSERT TO anon
  WITH CHECK (
    score >= 0 AND score <= 100
    AND char_length(username) BETWEEN 1 AND 30
    AND (archetype IS NULL OR char_length(archetype) <= 60)
  );

-- Note: legit app inserts (scan-tracking.ts) write overallScore (0-100), an X
-- handle (<= 15 chars), and a short archetype name — all well within these
-- bounds, so this does not break scan recording.
-- ============================================================================
