-- =====================================================================
-- Helpers, triggers, scoring
-- =====================================================================



-- ----- helper: is the current request from an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ----- auto-create profile on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----- updated_at trigger for predictions
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists predictions_touch_updated_at on public.predictions;
create trigger predictions_touch_updated_at
  before update on public.predictions
  for each row execute function public.touch_updated_at();

-- ----- prediction lock: 5 minutes before kickoff
create or replace function public.enforce_prediction_lock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kickoff timestamptz;
begin
  select kickoff_time into v_kickoff
  from public.matches where id = new.match_id;

  if v_kickoff is null then
    raise exception 'Match % does not exist', new.match_id;
  end if;

  -- Admins can override (e.g. corrections); regular users locked.
  if not public.is_admin() then
    if now() >= (v_kickoff - interval '5 minutes') then
      raise exception 'Predictions are locked for this match'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists predictions_lock_insert on public.predictions;
create trigger predictions_lock_insert
  before insert on public.predictions
  for each row execute function public.enforce_prediction_lock();

drop trigger if exists predictions_lock_update on public.predictions;
create trigger predictions_lock_update
  before update of predicted_winner, predicted_home_score, predicted_away_score
  on public.predictions
  for each row execute function public.enforce_prediction_lock();

-- ----- scoring: pure function
create or replace function public.score_prediction(
  p_winner     public.match_winner,
  p_home       integer,
  p_away       integer,
  a_winner     public.match_winner,
  a_home       integer,
  a_away       integer
) returns integer
language sql immutable as $$
  select
    case when a_winner is null or a_home is null or a_away is null then 0
    else
      (case when p_winner = a_winner then 1 else 0 end)
      + (case when p_home = a_home and p_away = a_away then 3 else 0 end)
    end;
$$;

-- ----- recompute scores when a match result is set / changed
create or replace function public.recompute_match_scores(p_match_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
begin
  select * into m from public.matches where id = p_match_id;
  if not found then return; end if;

  -- update every prediction for this match
  update public.predictions pr
     set points_awarded = public.score_prediction(
           pr.predicted_winner, pr.predicted_home_score, pr.predicted_away_score,
           m.winner,            m.actual_home_score,    m.actual_away_score
         )
   where pr.match_id = p_match_id;

  -- rebuild total_points for every user that predicted this match
  update public.profiles p
     set total_points = coalesce((
       select sum(pr.points_awarded)
       from public.predictions pr
       where pr.user_id = p.id
     ), 0)
   where p.id in (select user_id from public.predictions where match_id = p_match_id);
end;
$$;

revoke all on function public.recompute_match_scores(uuid) from public;
grant execute on function public.recompute_match_scores(uuid) to authenticated;

-- ----- derive winner + auto-score on match result update
create or replace function public.matches_after_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.actual_home_score is not null and new.actual_away_score is not null then
    new.winner :=
      case
        when new.actual_home_score > new.actual_away_score then 'home'
        when new.actual_home_score < new.actual_away_score then 'away'
        else 'draw'
      end;
    if new.status <> 'finished' then
      new.status := 'finished';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists matches_set_winner on public.matches;
create trigger matches_set_winner
  before insert or update of actual_home_score, actual_away_score
  on public.matches
  for each row execute function public.matches_after_result();

-- After commit of result, recompute predictions / totals.
create or replace function public.matches_after_result_recompute()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'UPDATE' and (
        new.actual_home_score is distinct from old.actual_home_score or
        new.actual_away_score is distinct from old.actual_away_score
      ))
     or (tg_op = 'INSERT' and new.actual_home_score is not null) then
    perform public.recompute_match_scores(new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists matches_recompute on public.matches;
create trigger matches_recompute
  after insert or update of actual_home_score, actual_away_score
  on public.matches
  for each row execute function public.matches_after_result_recompute();

-- ----- invite code generator
create or replace function public.gen_invite_code()
returns text
language plpgsql as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code     text := '';
  i        int;
begin
  for i in 1..6 loop
    code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return code;
end;
$$;
