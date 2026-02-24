-- Migration 014: Add rate limiting to increment_deck_view
-- Prevents view count inflation by deduplicating views per user/session per 24h

-- View log table for deduplication
create table if not exists public.deck_views (
  id          uuid primary key default gen_random_uuid(),
  deck_id     uuid not null references public.decks(id) on delete cascade,
  viewer_id   uuid,  -- auth.uid() if logged in, null for anon
  viewer_hash text,  -- hash of IP or session for anon users
  viewed_at   timestamptz not null default now()
);

create index if not exists idx_deck_views_deck on public.deck_views(deck_id);
create index if not exists idx_deck_views_recent
  on public.deck_views(deck_id, viewer_id, viewed_at desc);

-- Cleanup: auto-delete view logs older than 30 days (run via pg_cron)
-- DELETE FROM public.deck_views WHERE viewed_at < now() - interval '30 days';

-- Replace the unprotected increment function with a rate-limited version
create or replace function public.increment_deck_view(
  p_deck_id uuid,
  p_viewer_hash text default null
)
returns void as $$
declare
  v_user_id uuid := auth.uid();
begin
  -- Check if this viewer already viewed this deck in the last 24h
  if exists (
    select 1 from public.deck_views
    where deck_id = p_deck_id
      and viewed_at > now() - interval '24 hours'
      and (
        (v_user_id is not null and viewer_id = v_user_id)
        or
        (v_user_id is null and p_viewer_hash is not null and viewer_hash = p_viewer_hash)
      )
  ) then
    return; -- Already counted, skip
  end if;

  -- Log the view
  insert into public.deck_views (deck_id, viewer_id, viewer_hash)
  values (p_deck_id, v_user_id, p_viewer_hash);

  -- Increment the denormalized counter
  update public.decks
  set view_count = view_count + 1
  where id = p_deck_id and is_public = true;
end;
$$ language plpgsql security definer;
