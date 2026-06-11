-- =====================================================================
-- Optional seed data for local testing.
-- Run after creating at least one user via Supabase Auth.
-- Replace <USER_UUID> with that user's auth.users.id.
-- =====================================================================

-- Promote a user to admin:
-- update public.profiles set is_admin = true where id = '<USER_UUID>';

-- A couple of demo matches (delete these before going live):
insert into public.matches (home_team, away_team, kickoff_time, status)
values
  ('Mexico',      'South Africa', now() + interval '2 hours',  'scheduled'),
  ('South Korea', 'Czechia',      now() + interval '8 hours',  'scheduled'),
  ('Canada',      'Bosnia and Herzegovina', now() + interval '1 day', 'scheduled')
on conflict do nothing;
