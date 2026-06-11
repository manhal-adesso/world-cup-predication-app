-- =====================================================================
-- Helper views for leaderboards
-- =====================================================================

create or replace view public.global_leaderboard as
select
  p.id,
  p.display_name,
  p.avatar_url,
  p.total_points,
  rank() over (order by p.total_points desc, p.created_at asc) as rank
from public.profiles p;

-- Views in Supabase inherit RLS from underlying tables.
grant select on public.global_leaderboard to anon, authenticated;
