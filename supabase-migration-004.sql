-- Migration 004: Add script_rows column + write RLS policies

-- Script rows (multilingual structured table)
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS script_rows jsonb DEFAULT '[]'::jsonb;

-- Allow INSERT/UPDATE/DELETE on all tables for anon role
-- (internal app — no user auth required)

-- briefs
CREATE POLICY IF NOT EXISTS "allow insert briefs"
  ON briefs FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "allow update briefs"
  ON briefs FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "allow delete briefs"
  ON briefs FOR DELETE
  USING (true);

-- creatives
CREATE POLICY IF NOT EXISTS "allow insert creatives"
  ON creatives FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "allow update creatives"
  ON creatives FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "allow delete creatives"
  ON creatives FOR DELETE
  USING (true);

-- ad_performance
CREATE POLICY IF NOT EXISTS "allow insert ad_performance"
  ON ad_performance FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "allow update ad_performance"
  ON ad_performance FOR UPDATE
  USING (true)
  WITH CHECK (true);
