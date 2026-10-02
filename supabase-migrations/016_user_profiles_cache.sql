-- 016: user_profiles — canonical archetype profile cache (fixes silent 42501)
--
-- History: the app wrote to user_profiles from server routes through the
-- anon-key browser Supabase client. On prod, RLS (correctly) denied those
-- inserts since March — silent profile-cache failure on /api/x-brand-score.
-- On staging the table never existed at all.
--
-- Fix: recreate as a Prisma-owned server-only table following the 013
-- ProcessedWebhook pattern — RLS enabled with NO policies (denies anon and
-- authenticated); server code reaches it via Prisma as table owner.
-- src/lib/user-profiles.ts now goes through Prisma (model UserProfile).
--
-- Any pre-existing prod table is renamed to user_profiles_pre016 (contents
-- are at best stale pre-March cache rows) — inspect and drop at leisure:
--   DROP TABLE IF EXISTS public.user_profiles_pre016;
--
-- Idempotent: the rename only fires for a table missing the new updated_at
-- column, and creation uses IF NOT EXISTS.

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'user_profiles'
  ) AND NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'user_profiles'
      AND column_name = 'updated_at'
  ) AND NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public' AND tablename = 'user_profiles_pre016'
  ) THEN
    ALTER TABLE public.user_profiles RENAME TO user_profiles_pre016;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_profiles (
  username          TEXT PRIMARY KEY,            -- normalized lowercase, no @
  display_name      TEXT NOT NULL,
  archetype         TEXT NOT NULL,               -- JSON: ArchetypeData
  archetype_history TEXT NOT NULL DEFAULT '[]',  -- JSON: ArchetypeHistoryEntry[]
  scores            TEXT NOT NULL DEFAULT '[]',  -- JSON: ScoreRecord[] (last 20)
  highest_score     INTEGER NOT NULL DEFAULT 0,
  current_score     INTEGER NOT NULL DEFAULT 0,
  first_scanned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_scanned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_scans       INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_current_score
  ON public.user_profiles (current_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_scanned_at
  ON public.user_profiles (last_scanned_at DESC);

-- Service-role/owner only: RLS on with NO policies denies anon + authenticated.
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
