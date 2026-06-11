-- =====================================================================
-- World Cup Predictions: Schema
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text not null,
  avatar_url    text,
  is_admin      boolean not null default false,
  total_points  integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists profiles_total_points_idx
  on public.profiles (total_points desc);

-- ---------- matches ----------
do $$ begin
  create type public.match_status as enum ('scheduled', 'live', 'finished', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.match_winner as enum ('home', 'away', 'draw');
exception when duplicate_object then null; end $$;

create table if not exists public.matches (
  id                  uuid primary key default gen_random_uuid(),
  external_id         text unique,                       -- e.g. ICS UID
  home_team           text not null,
  away_team           text not null,
  kickoff_time        timestamptz not null,
  actual_home_score   integer,
  actual_away_score   integer,
  winner              public.match_winner,
  status              public.match_status not null default 'scheduled',
  created_at          timestamptz not null default now(),
  constraint matches_scores_chk
    check (
      (actual_home_score is null and actual_away_score is null)
      or (actual_home_score >= 0 and actual_away_score >= 0)
    )
);

create index if not exists matches_kickoff_idx on public.matches (kickoff_time);
create index if not exists matches_status_idx  on public.matches (status);

-- ---------- predictions ----------
create table if not exists public.predictions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references public.profiles(id) on delete cascade,
  match_id               uuid not null references public.matches(id)  on delete cascade,
  predicted_winner       public.match_winner not null,
  predicted_home_score   integer not null check (predicted_home_score between 0 and 30),
  predicted_away_score   integer not null check (predicted_away_score between 0 and 30),
  points_awarded         integer not null default 0,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (user_id, match_id),
  constraint predictions_winner_consistency_chk check (
    (predicted_home_score >  predicted_away_score and predicted_winner = 'home')
 or (predicted_home_score <  predicted_away_score and predicted_winner = 'away')
 or (predicted_home_score =  predicted_away_score and predicted_winner = 'draw')
  )
);

create index if not exists predictions_user_idx  on public.predictions (user_id);
create index if not exists predictions_match_idx on public.predictions (match_id);

-- ---------- leagues ----------
create table if not exists public.leagues (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  invite_code  text not null unique,
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now()
);

create index if not exists leagues_owner_idx on public.leagues (owner_id);

-- ---------- league_members ----------
create table if not exists public.league_members (
  id          uuid primary key default gen_random_uuid(),
  league_id   uuid not null references public.leagues(id)   on delete cascade,
  user_id     uuid not null references public.profiles(id)  on delete cascade,
  created_at  timestamptz not null default now(),
  unique (league_id, user_id)
);

create index if not exists league_members_league_idx on public.league_members (league_id);
create index if not exists league_members_user_idx   on public.league_members (user_id);
