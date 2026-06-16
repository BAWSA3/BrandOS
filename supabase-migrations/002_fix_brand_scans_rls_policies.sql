-- ============================================================================
-- Migration: Fix BrandScans RLS policies
-- Date: 2026-03-25
-- Issue: Original anon-role policies were replaced with authenticated-role
--        policies that required a userId column (which doesn't exist).
--        This silently broke scan recording from 2026-03-17 onward.
-- ============================================================================

-- Drop the broken authenticated-role policies
DROP POLICY IF EXISTS "BrandScans user select" ON "BrandScans";
DROP POLICY IF EXISTS "BrandScans user insert" ON "BrandScans";
DROP POLICY IF EXISTS "BrandScans user update" ON "BrandScans";
DROP POLICY IF EXISTS "BrandScans user delete" ON "BrandScans";

-- Also drop originals in case they still exist (idempotent)
DROP POLICY IF EXISTS "Allow anonymous inserts" ON "BrandScans";
DROP POLICY IF EXISTS "Allow anonymous reads" ON "BrandScans";

-- Restore the correct anon-role policies
CREATE POLICY "Allow anonymous inserts" ON "BrandScans"
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anonymous reads" ON "BrandScans"
  FOR SELECT TO anon USING (true);
