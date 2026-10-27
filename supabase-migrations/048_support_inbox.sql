-- ============================================================================
-- Migration: support inbox — "SupportThread" + "SupportMessage"
-- Date: 2026-10-27
--
-- One inbox for member feedback (the feedback button) and replies to our
-- emails (Resend inbound → /api/webhook/resend-inbound). Each conversation is a
-- thread; the support agent triages it (category, priority, one-line summary)
-- and keeps a draft reply in "draft". Nothing is sent until an admin presses
-- Send in /admin → Inbox.
--
-- "SupportMessage"."emailId" is the Resend email id (inbound or outbound):
-- unique, so a retried webhook delivery can't add the same email twice.
-- "messageId" is the RFC 5322 Message-ID, used to thread replies
-- (In-Reply-To / References).
--
-- New tables: the app works before this is applied (feedback still saves to
-- "Feedback"; the inbox and inbound webhook return errors until it lands).
--
-- RLS on, NO policies; anon/authenticated revoked. Server-only via Prisma.
-- Idempotent. Apply to staging, then prod:
--   node --env-file=<env> scripts/apply-migration.mjs supabase-migrations/048_support_inbox.sql
-- ============================================================================

CREATE TABLE IF NOT EXISTS "SupportThread" (
  "id"            TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  "source"        TEXT NOT NULL CHECK ("source" IN ('feedback', 'email')),
  "email"         TEXT,
  "name"          TEXT,
  "userId"        TEXT,
  "feedbackId"    TEXT UNIQUE,
  "subject"       TEXT NOT NULL,
  "status"        TEXT NOT NULL DEFAULT 'open' CHECK ("status" IN ('open', 'replied', 'closed')),
  "category"      TEXT,
  "priority"      TEXT,
  "summary"       TEXT,
  "draft"         TEXT,
  "lastMessageAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "SupportThread_status_lastMessageAt_idx" ON "SupportThread" ("status", "lastMessageAt");
CREATE INDEX IF NOT EXISTS "SupportThread_email_idx" ON "SupportThread" ("email");

CREATE TABLE IF NOT EXISTS "SupportMessage" (
  "id"        TEXT PRIMARY KEY DEFAULT (gen_random_uuid())::text,
  "threadId"  TEXT NOT NULL REFERENCES "SupportThread"("id") ON DELETE CASCADE,
  "direction" TEXT NOT NULL CHECK ("direction" IN ('in', 'out')),
  "body"      TEXT NOT NULL,
  "emailId"   TEXT UNIQUE,
  "messageId" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "SupportMessage_threadId_createdAt_idx" ON "SupportMessage" ("threadId", "createdAt");
CREATE INDEX IF NOT EXISTS "SupportMessage_messageId_idx" ON "SupportMessage" ("messageId");

ALTER TABLE public."SupportThread" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."SupportMessage" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public."SupportThread" FROM anon, authenticated;
REVOKE ALL ON TABLE public."SupportMessage" FROM anon, authenticated;
