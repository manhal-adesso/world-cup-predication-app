-- =====================================================================
-- Knockout stage: penalty predictions
-- =====================================================================

-- Add is_knockout flag to matches
alter table public.matches add column is_knockout boolean not null default false;

-- Add penalty scores to matches (admin enters these for matches that go to penalties)
alter table public.matches add column penalty_home_score integer;
alter table public.matches add column penalty_away_score integer;

-- Add predicted penalty scores to predictions
alter table public.predictions add column predicted_penalty_home integer;
alter table public.predictions add column predicted_penalty_away integer;
