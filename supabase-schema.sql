-- Run this in your Supabase SQL editor

-- Briefs: creative planning before launch
create table briefs (
  id uuid primary key default gen_random_uuid(),
  concept_id text not null,          -- e.g. C013
  angle text not null,               -- e.g. Upgrade, Diagnostic
  format text not null,              -- UGC, Static, Carousel, etc.
  hook text not null,
  markets text[] not null default '{}',
  awareness_stage text not null default 'top',
  notes text,
  created_at timestamptz not null default now()
);

-- Creatives: links brief to a live Meta ad
create table creatives (
  id uuid primary key default gen_random_uuid(),
  brief_id uuid not null references briefs(id) on delete cascade,
  meta_ad_id text not null,
  meta_ad_name text not null,
  market text not null,
  thumbnail_url text,
  linked_at timestamptz not null default now()
);

create index on creatives(brief_id);
create index on creatives(meta_ad_id);

-- Ad performance: pushed daily by n8n
create table ad_performance (
  id uuid primary key default gen_random_uuid(),
  meta_ad_id text not null,
  market text not null,
  campaign_type text not null,       -- ABO or CBO
  date date not null,
  spend numeric not null default 0,
  revenue numeric not null default 0,
  conversions integer not null default 0,
  impressions integer not null default 0,
  clicks integer not null default 0,
  thumbstop_rate numeric,
  roas numeric not null default 0,
  cpa numeric not null default 0,
  ctr numeric not null default 0,
  unique (meta_ad_id, market, campaign_type, date)
);

create index on ad_performance(meta_ad_id);
create index on ad_performance(date);
create index on ad_performance(market);
