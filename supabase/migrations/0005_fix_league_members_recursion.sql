-- =====================================================================
-- Fix infinite recursion in league_members RLS + restrict league
-- creation to admins only.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) Helper: is the current user a member of the given league?
--    SECURITY DEFINER so it bypasses RLS on league_members and avoids
--    the policy-recursion problem.
-- ---------------------------------------------------------------------
create or replace function public.is_league_member(p_league_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.league_members lm
    where lm.league_id = p_league_id
      and lm.user_id  = auth.uid()
  );
$$;

revoke all on function public.is_league_member(uuid) from public;
grant execute on function public.is_league_member(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 2) Helper: is the current user the owner of the given league?
--    Also SECURITY DEFINER so policies don't recurse via leagues policy.
-- ---------------------------------------------------------------------
create or replace function public.is_league_owner(p_league_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.leagues l
    where l.id = p_league_id
      and l.owner_id = auth.uid()
  );
$$;

revoke all on function public.is_league_owner(uuid) from public;
grant execute on function public.is_league_owner(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 3) Rewrite the recursive policies on league_members using the helpers
-- ---------------------------------------------------------------------
drop policy if exists "members read same league" on public.league_members;
create policy "members read same league"
  on public.league_members for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.is_league_member(league_id)
    or public.is_league_owner(league_id)
  );

drop policy if exists "members leave self" on public.league_members;
create policy "members leave self"
  on public.league_members for delete
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_admin()
    or public.is_league_owner(league_id)
  );

-- ---------------------------------------------------------------------
-- 4) Also rewrite the leagues SELECT policy so it does not query
--    league_members directly (which would re-enter that table's RLS).
-- ---------------------------------------------------------------------
drop policy if exists "leagues read member" on public.leagues;
create policy "leagues read member"
  on public.leagues for select
  to authenticated
  using (
    owner_id = auth.uid()
    or public.is_admin()
    or public.is_league_member(id)
  );

-- ---------------------------------------------------------------------
-- 5) Restrict league creation to admins only
-- ---------------------------------------------------------------------
drop policy if exists "leagues insert owner" on public.leagues;
drop policy if exists "leagues insert admin" on public.leagues;
create policy "leagues insert admin"
  on public.leagues for insert
  to authenticated
  with check (
    public.is_admin()
    and owner_id = auth.uid()
  );
