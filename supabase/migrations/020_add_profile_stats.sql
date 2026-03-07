-- Migration: Add profile statistics columns
-- Run date: March 7, 2026

-- Add stats columns to profiles table
alter table public.profiles
  add column if not exists total_decks integer not null default 0,
  add column if not exists public_decks integer not null default 0,
  add column if not exists favorite_archetype text,
  add column if not exists most_used_colors text[] not null default '{}',
  add column if not exists profile_views integer not null default 0,
  add column if not exists follower_count integer not null default 0,
  add column if not exists following_count integer not null default 0;

-- Create indexes for common queries
create index if not exists idx_profiles_username_lower 
  on public.profiles (lower(username));

create index if not exists idx_profiles_created_at 
  on public.profiles (created_at desc);

-- Function to update profile stats when decks change
create or replace function public.update_profile_deck_stats()
returns trigger as $$
declare
  v_user_id uuid;
  v_total_count integer;
  v_public_count integer;
  v_colors text[];
  v_archetype text;
begin
  -- Get the user_id from the deck
  if TG_OP = 'DELETE' then
    v_user_id := old.user_id;
  else
    v_user_id := new.user_id;
  end if;

  -- Skip if deck has no owner (official decks)
  if v_user_id is null then
    return new;
  end if;

  -- Count total and public decks
  select 
    count(*),
    count(*) filter (where is_public = true)
  into v_total_count, v_public_count
  from public.decks
  where user_id = v_user_id;

  -- Get most used colors (union of all deck colors, count frequency)
  select array_agg(distinct unnest_val order by unnest_val)
  into v_colors
  from (
    select unnest(colors) as unnest_val
    from public.decks
    where user_id = v_user_id
    limit 100
  ) subq
  limit 5;

  -- Get most common archetype
  select archetype
  into v_archetype
  from public.decks
  where user_id = v_user_id
    and archetype is not null
  group by archetype
  order by count(*) desc
  limit 1;

  -- Update profile stats
  update public.profiles
  set
    total_decks = v_total_count,
    public_decks = v_public_count,
    most_used_colors = coalesce(v_colors, '{}'),
    favorite_archetype = v_archetype,
    updated_at = now()
  where id = v_user_id;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger to update stats when decks are modified
drop trigger if exists trg_update_profile_deck_stats on public.decks;
create trigger trg_update_profile_deck_stats
  after insert or update or delete on public.decks
  for each row
  execute function public.update_profile_deck_stats();

-- Function to increment profile views
create or replace function public.increment_profile_views(profile_username text)
returns void as $$
begin
  update public.profiles
  set profile_views = profile_views + 1
  where lower(username) = lower(profile_username);
end;
$$ language plpgsql security definer;

-- Refresh stats for existing profiles
do $$
declare
  v_profile record;
begin
  for v_profile in select id from public.profiles
  loop
    perform public.update_profile_deck_stats();
  end loop;
end;
$$;

-- Add comment
comment on column public.profiles.total_decks is 'Total number of decks created by user';
comment on column public.profiles.public_decks is 'Number of public decks created by user';
comment on column public.profiles.favorite_archetype is 'Most frequently built archetype';
comment on column public.profiles.most_used_colors is 'Top 5 most used colors across user decks';
comment on column public.profiles.profile_views is 'Total profile page views';
comment on column public.profiles.follower_count is 'Number of users following this profile';
comment on column public.profiles.following_count is 'Number of profiles this user follows';
