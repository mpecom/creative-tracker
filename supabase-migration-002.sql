-- Migration 002: Add concept, offer, inspiration_url, script, status to briefs
-- Run this in Supabase SQL Editor

-- Add new columns
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS concept text;
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS offer text;
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS inspiration_url text;
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS script text;
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'idea';

-- Migrate notes → concept (copy existing data)
UPDATE briefs SET concept = notes WHERE notes IS NOT NULL AND concept IS NULL;

-- Update awareness_stage values from old format to new
UPDATE briefs SET awareness_stage = 'Problem Aware' WHERE awareness_stage = 'top';
UPDATE briefs SET awareness_stage = 'Solution Aware' WHERE awareness_stage = 'mid';
UPDATE briefs SET awareness_stage = 'Most Aware' WHERE awareness_stage = 'bottom';

-- Set status based on existing data:
--   briefs with performance data → 'active'
--   briefs with a linked creative → 'live'
--   everything else stays 'idea'
UPDATE briefs SET status = 'live'
WHERE id IN (SELECT DISTINCT brief_id FROM creatives)
AND status = 'idea';

UPDATE briefs SET status = 'active'
WHERE id IN (
  SELECT DISTINCT b.id FROM briefs b
  JOIN creatives c ON c.brief_id = b.id
  JOIN ad_performance ap ON ap.meta_ad_id = c.meta_ad_id
  WHERE ap.spend > 0
)
AND status IN ('idea', 'live');

-- Add RLS policy for updates if not exists
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'briefs' AND policyname = 'allow update briefs') THEN
    CREATE POLICY "allow update briefs" ON briefs FOR UPDATE USING (true);
  END IF;
END $$;
