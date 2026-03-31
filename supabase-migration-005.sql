-- Migration 005: Insert missing seed rows C013 & C014 + ensure SELECT policies exist

-- Add SELECT policies (in case RLS gets re-enabled)
CREATE POLICY "allow select briefs"       ON briefs         FOR SELECT USING (true);
CREATE POLICY "allow select creatives"    ON creatives      FOR SELECT USING (true);
CREATE POLICY "allow select ad_performance" ON ad_performance FOR SELECT USING (true);

-- Insert the two seed briefs that were missing from production
INSERT INTO briefs (id, concept_id, format, angle, hook, markets, awareness_stage, concept, offer, inspiration_url, script, status, created_at)
VALUES
(
  '00000000-0000-0000-0000-000000000013',
  'C013', 'UGC', 'Humor',
  'POV: You finally stopped overthinking it',
  ARRAY['NL','FR'],
  'Unaware',
  'Comedy skit — relatable overthinking moment, product as the simple solution.',
  '10% off with code SIMPLE',
  'https://www.instagram.com/reel/example',
  E'[HOOK]\nPOV: You''ve been overthinking for 3 hours\n\n[COMEDY]\nShow the spiral of research\n\n[TWIST]\n"Or you could just try this"\n\n[CTA]\n"Code SIMPLE for 10% off"',
  'script',
  NOW() - INTERVAL '5 days'
),
(
  '00000000-0000-0000-0000-000000000014',
  'C014', 'Video', 'Scarcity',
  'This offer disappears at midnight',
  ARRAY['NL','DE','ES'],
  'Most Aware',
  'Countdown-style video for end-of-month push.',
  'Last chance — 40% off',
  NULL,
  NULL,
  'idea',
  NOW() - INTERVAL '3 days'
)
ON CONFLICT (id) DO NOTHING;
