-- ============================================================================
-- Migration: "PostMetricCheckpoint"
-- Date: 2026-10-28
--
-- Post look-back loop (docs/POST-LOOKBACK-SPEC.md). AccountPost keeps only a
-- post's latest numbers (overwritten on every sync). This table keeps a fixed
-- copy of a member's post numbers at set ages, so a look-back can say "this
-- post has settled" and compare like with like:
--   first: the first sync that saw the post
--   24h:   the first sync at which the post was at least 24h old
--   48h:   the first sync at which the post was at least 48h old
-- ageHours records the real age at capture (syncs are nightly, so a "24h"
-- checkpoint can land anywhere from 24h to ~48h).
--
-- Brands only (TrackedAccount.competitorOfId IS NULL); written by the nightly
-- sync-accounts cron from data it already fetches (no extra SocialData calls).
-- New table, nothing existing changes. The app skips checkpoint writes until
-- this is applied.
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PostMetricCheckpoint" (
  "accountId"  TEXT NOT NULL REFERENCES "TrackedAccount"("id") ON DELETE CASCADE,
  "tweetId"    TEXT NOT NULL CHECK ("tweetId" ~ '^[0-9]{1,25}$'),
  "checkpoint" TEXT NOT NULL CHECK ("checkpoint" IN ('first', '24h', '48h')),
  "capturedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "ageHours"   REAL NOT NULL,
  "likes"      INTEGER NOT NULL DEFAULT 0,
  "replies"    INTEGER NOT NULL DEFAULT 0,
  "reposts"    INTEGER NOT NULL DEFAULT 0,
  "quotes"     INTEGER NOT NULL DEFAULT 0,
  "bookmarks"  INTEGER NOT NULL DEFAULT 0,
  "views"      INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY ("accountId", "tweetId", "checkpoint"),
  FOREIGN KEY ("accountId", "tweetId") REFERENCES "AccountPost"("accountId", "tweetId") ON DELETE CASCADE
);

-- Server-only, same as AccountPost (Prisma via the service connection).
ALTER TABLE public."PostMetricCheckpoint" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."PostMetricCheckpoint" FROM anon, authenticated;
