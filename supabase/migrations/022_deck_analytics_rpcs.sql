-- Migration 022: Per-deck analytics RPCs
-- Provides read RPCs for the analytics API layer and a recompute routine
-- called on deck save / visibility change.

-- ── get_deck_analytics ────────────────────────────────────────────────────────
-- Returns the latest analytics snapshot plus a 7-day sparkline for a deck.
-- Respects the same visibility rules as the underlying RLS policies.

create or replace function public.get_deck_analytics(p_deck_id uuid)
returns table (
  deck_id                 uuid,
  snapshot_date           date,
  view_count_delta        integer,
  like_count_delta        integer,
  meta_proximity_score    numeric,
  consistency_index       numeric,
  archetype_popularity_rank integer,
  color_combo_rank          integer,
  trend_direction         text,
  -- 7-day sparkline: array of (date, meta_proximity_score) ordered oldest-first
  sparkline_dates         date[],
  sparkline_scores        numeric[]
)
language sql stable security invoker
as $$
  with latest as (
    select *
    from public.deck_analytics
    where deck_analytics.deck_id = p_deck_id
    order by snapshot_date desc
    limit 1
  ),
  sparkline as (
    select
      array_agg(snapshot_date order by snapshot_date asc) as dates,
      array_agg(meta_proximity_score order by snapshot_date asc) as scores
    from public.deck_analytics
    where deck_analytics.deck_id = p_deck_id
      and snapshot_date >= current_date - interval '7 days'
  )
  select
    l.deck_id,
    l.snapshot_date,
    l.view_count_delta,
    l.like_count_delta,
    l.meta_proximity_score,
    l.consistency_index,
    l.archetype_popularity_rank,
    l.color_combo_rank,
    l.trend_direction,
    coalesce(s.dates, array[]::date[]),
    coalesce(s.scores, array[]::numeric[])
  from latest l
  cross join sparkline s;
$$;

-- ── get_deck_card_analytics ───────────────────────────────────────────────────
-- Returns per-card analytics for a deck, ordered by performance_score desc.

create or replace function public.get_deck_card_analytics(p_deck_id uuid)
returns table (
  card_id                     text,
  inclusion_rate_in_archetype numeric,
  performance_score           numeric,
  trend_direction             text
)
language sql stable security invoker
as $$
  select
    dca.card_id,
    dca.inclusion_rate_in_archetype,
    dca.performance_score,
    dca.trend_direction
  from public.deck_card_analytics dca
  where dca.deck_id = p_deck_id
  order by dca.performance_score desc;
$$;

-- ── get_deck_meta_comparison ──────────────────────────────────────────────────
-- Returns a deck's positioning relative to the top 5 meta archetypes.
-- Uses the most recent archetype_stats_history rows for ranking context.

create or replace function public.get_deck_meta_comparison(p_deck_id uuid)
returns table (
  deck_id              uuid,
  deck_archetype       text,
  meta_proximity_score numeric,
  top_archetypes       text[],
  archetype_meta_shares numeric[],
  archetype_win_rates  numeric[]
)
language sql stable security invoker
as $$
  with deck_info as (
    select d.id, d.archetype, da.meta_proximity_score
    from public.decks d
    left join public.deck_analytics da on da.deck_id = d.id
      and da.snapshot_date = (
        select max(snapshot_date) from public.deck_analytics where deck_id = d.id
      )
    where d.id = p_deck_id
  ),
  latest_snapshot as (
    select id from public.meta_snapshots
    order by snapshot_date desc limit 1
  ),
  top_5 as (
    select
      a.id as archetype_id,
      ash.win_rate,
      ash.play_rate,
      ash.meta_rank
    from public.archetype_stats_history ash
    join public.archetypes a on a.id = ash.archetype_id
    join latest_snapshot ls on ash.snapshot_id = ls.id
    order by ash.meta_rank asc
    limit 5
  )
  select
    di.id,
    di.archetype,
    di.meta_proximity_score,
    array_agg(top_5.archetype_id order by top_5.meta_rank),
    array_agg(top_5.play_rate order by top_5.meta_rank),
    array_agg(top_5.win_rate order by top_5.meta_rank)
  from deck_info di
  cross join top_5
  group by di.id, di.archetype, di.meta_proximity_score;
$$;

-- ── recompute_deck_analytics ──────────────────────────────────────────────────
-- On-demand upsert called by the API layer after:
--   • A deck is saved / cards are updated
--   • Deck visibility is toggled
-- The heavy lifting (meta_proximity_score, consistency_index) is done in
-- the TypeScript layer using computeDeckMetaProximity / computeConsistencyIndex;
-- this function accepts the pre-computed values and persists them.

create or replace function public.recompute_deck_analytics(
  p_deck_id             uuid,
  p_meta_proximity      numeric default 0,
  p_consistency_index   numeric default 0,
  p_trend_direction     text    default 'flat'
)
returns void
language plpgsql security definer
as $$
declare
  v_is_public       boolean;
  v_archetype       text;
  v_colors          text[];
  v_arch_rank       integer;
  v_color_rank      integer;
  v_view_delta      integer;
begin
  -- Verify deck exists and read metadata
  select is_public, archetype, colors
  into v_is_public, v_archetype, v_colors
  from public.decks
  where id = p_deck_id;

  if not found then
    raise exception 'Deck % not found', p_deck_id;
  end if;

  -- Today's view delta from deck_views dedupe table
  select count(*)::integer into v_view_delta
  from public.deck_views
  where deck_id = p_deck_id
    and viewed_at >= current_date
    and viewed_at < current_date + interval '1 day';

  -- Archetype popularity rank among public decks with same archetype
  if v_is_public and v_archetype is not null then
    select (
      select count(*) + 1
      from public.decks d2
      join public.deck_analytics da2 on da2.deck_id = d2.id
        and da2.snapshot_date = current_date
      where d2.is_public = true
        and d2.archetype = v_archetype
        and d2.id <> p_deck_id
        and (da2.view_count_delta + da2.like_count_delta * 3) >
            coalesce((
              select view_count_delta + like_count_delta * 3
              from public.deck_analytics
              where deck_id = p_deck_id and snapshot_date = current_date
            ), 0)
    ) into v_arch_rank;
  end if;

  -- Color combo rank
  if v_is_public and v_colors is not null then
    select (
      select count(*) + 1
      from public.decks d3
      join public.deck_analytics da3 on da3.deck_id = d3.id
        and da3.snapshot_date = current_date
      where d3.is_public = true
        and d3.colors = v_colors
        and d3.id <> p_deck_id
        and (da3.view_count_delta + da3.like_count_delta * 3) >
            coalesce((
              select view_count_delta + like_count_delta * 3
              from public.deck_analytics
              where deck_id = p_deck_id and snapshot_date = current_date
            ), 0)
    ) into v_color_rank;
  end if;

  -- Upsert today's snapshot
  insert into public.deck_analytics (
    deck_id,
    snapshot_date,
    view_count_delta,
    like_count_delta,
    meta_proximity_score,
    consistency_index,
    archetype_popularity_rank,
    color_combo_rank,
    trend_direction
  )
  values (
    p_deck_id,
    current_date,
    coalesce(v_view_delta, 0),
    0,  -- like delta updated by like toggle separately
    p_meta_proximity,
    p_consistency_index,
    v_arch_rank,
    v_color_rank,
    p_trend_direction
  )
  on conflict (deck_id, snapshot_date) do update set
    meta_proximity_score      = excluded.meta_proximity_score,
    consistency_index         = excluded.consistency_index,
    archetype_popularity_rank = excluded.archetype_popularity_rank,
    color_combo_rank          = excluded.color_combo_rank,
    trend_direction           = excluded.trend_direction,
    view_count_delta          = excluded.view_count_delta,
    updated_at                = now();
end;
$$;

-- ── snapshot_public_decks (daily rollup stub) ─────────────────────────────────
-- Called by a pg_cron job once per day to roll aggregated deltas into history.
-- The actual heavy scoring is done by the background worker (TypeScript pipeline);
-- this SQL function copies today's deltas into the next day's baseline.
-- Schedule example (add in Supabase dashboard → Database → pg_cron):
--   select cron.schedule('deck-analytics-daily', '0 3 * * *', 'select public.snapshot_public_decks()');

create or replace function public.snapshot_public_decks()
returns void
language sql security definer
as $$
  -- Insert a fresh row for today for any public deck that doesn't have one yet
  insert into public.deck_analytics (deck_id, snapshot_date, trend_direction)
  select d.id, current_date, 'flat'
  from public.decks d
  where d.is_public = true
  on conflict (deck_id, snapshot_date) do nothing;
$$;
