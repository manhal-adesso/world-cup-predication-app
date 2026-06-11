-- =====================================================================
-- Row Level Security
-- =====================================================================

alter table public.profiles       enable row level security;
alter table public.matches        enable row level security;
alter table public.predictions    enable row level security;
alter table public.leagues        enable row level security;
alter table public.league_members enable row level security;

-- ---------- profiles ----------
-- Anyone authenticated can read public profile fields (used for leaderboards).
drop policy if exists "profiles read all" on public.profiles;
create policy "profiles read all"
  on public.profiles for select
  to authenticated
  using (true);

drop policy if exists "profiles update self" on public.profiles;
create policy "profiles update self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    -- prevent users from elevating themselves to admin or editing points
    and is_admin     = (select p.is_admin     from public.profiles p where p.id = auth.uid())
    and total_points = (select p.total_points from public.profiles p where p.id = auth.uid())
  );

drop policy if exists "profiles admin all" on public.profiles;
create policy "profiles admin all"
  on public.profiles for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- matches ----------
drop policy if exists "matches read all" on public.matches;
create policy "matches read all"
  on public.matches for select
  to anon, authenticated
  using (true);

drop policy if exists "matches admin write" on public.matches;
create policy "matches admin write"
  on public.matches for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- predictions ----------
-- A user can read their own predictions; admins can read all.
drop policy if exists "predictions read own" on public.predictions;
create policy "predictions read own"
  on public.predictions for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "predictions insert own" on public.predictions;
create policy "predictions insert own"
  on public.predictions for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "predictions update own" on public.predictions;
create policy "predictions update own"
  on public.predictions for update
  to authenticated
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    -- users may not write points themselves
    and points_awarded = (
      select pr.points_awarded from public.predictions pr where pr.id = predictions.id
    )
  );

drop policy if exists "predictions delete own" on public.predictions;
create policy "predictions delete own"
  on public.predictions for delete
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "predictions admin all" on public.predictions;
create policy "predictions admin all"
  on public.predictions for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- leagues ----------
-- A user can read any league they belong to (or own). Admin can read all.
drop policy if exists "leagues read member" on public.leagues;
create policy "leagues read member"
  on public.leagues for select
  to authenticated
  using (
    owner_id = auth.uid()
    or exists (
      select 1 from public.league_members lm
      where lm.league_id = leagues.id and lm.user_id = auth.uid()
    )
    or public.is_admin()
  );

drop policy if exists "leagues insert owner" on public.leagues;
create policy "leagues insert owner"
  on public.leagues for insert
  to authenticated
  with check (owner_id = auth.uid());

drop policy if exists "leagues update owner" on public.leagues;
create policy "leagues update owner"
  on public.leagues for update
  to authenticated
  using (owner_id = auth.uid() or public.is_admin())
  with check (owner_id = auth.uid() or public.is_admin());

drop policy if exists "leagues delete owner" on public.leagues;
create policy "leagues delete owner"
  on public.leagues for delete
  to authenticated
  using (owner_id = auth.uid() or public.is_admin());

-- ---------- league_members ----------
-- Users can see members of leagues they belong to.
drop policy if exists "members read same league" on public.league_members;
create policy "members read same league"
  on public.league_members for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.league_members me
      where me.league_id = league_members.league_id
        and me.user_id = auth.uid()
    )
    or exists (
      select 1 from public.leagues l
      where l.id = league_members.league_id and l.owner_id = auth.uid()
    )
  );

drop policy if exists "members join self" on public.league_members;
create policy "members join self"
  on public.league_members for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "members leave self" on public.league_members;
create policy "members leave self"
  on public.league_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or exists (
      select 1 from public.leagues l
      where l.id = league_members.league_id and l.owner_id = auth.uid()
    )
  );
