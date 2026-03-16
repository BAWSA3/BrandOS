-- ============================================================================
-- Migration: Add BrandScans table + xUsername column to EmailSignup
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ============================================================================

-- 1. Create BrandScans table to track every scan
CREATE TABLE IF NOT EXISTS "BrandScans" (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL,
  score integer NOT NULL,
  archetype text DEFAULT 'unknown',
  enhanced boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Index for fast lookups by username and time-based queries
CREATE INDEX IF NOT EXISTS idx_brand_scans_username ON "BrandScans" (username);
CREATE INDEX IF NOT EXISTS idx_brand_scans_created_at ON "BrandScans" (created_at DESC);

-- Enable RLS (Row Level Security) but allow inserts/reads from anon key
ALTER TABLE "BrandScans" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous inserts" ON "BrandScans"
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous reads" ON "BrandScans"
  FOR SELECT TO anon USING (true);

-- 2. Add xUsername column to EmailSignup (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'EmailSignup' AND column_name = 'xUsername'
  ) THEN
    ALTER TABLE "EmailSignup" ADD COLUMN "xUsername" text;
  END IF;
END $$;

-- Index for looking up signups by X username
CREATE INDEX IF NOT EXISTS idx_email_signup_x_username ON "EmailSignup" ("xUsername");
