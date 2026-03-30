-- Migration 003: Add assignee, due_date, content_url, briefing_url to briefs
-- Run this in Supabase SQL Editor

ALTER TABLE briefs ADD COLUMN IF NOT EXISTS assignee text;
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS content_url text;
ALTER TABLE briefs ADD COLUMN IF NOT EXISTS briefing_url text;
