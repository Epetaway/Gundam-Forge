-- Migration 021: Per-deck analytics tables
-- Provides deck-level snapshots and card-level contribution scoring,
-- enabling interactive analytics panels for public (and owner-visible) decks.

-- ── deck_analytics ────────────────────────────────────────────────────────────
-- One row per deck per day (upserted). Tracks engagement deltas and computed
-- meta-positioning metrics. Only readable via RLS if the deck is public,
-- OR the requesting user owns the deck.

create table if not exists public.deck_analytics (
  id                      bigserial primary key,
  deck_id                 uuid        not null references public.decks(id) on delete cascade,
  snapshot_date           date        not null default current_date,

  -- Engagement deltas for the snapshot day -----------------------------------
  view_count_delta        integer     not null default 0 check (view_count_delta >= 0),
  like_count_delta        integer     not null default 0 check (like_count_delta >= 0),

  -- Meta positioning (0-100 normalised scores) --------------------------------
  -- How closely the deck's cards overlap with the top-5 meta archetypes.
  meta_proximity_score    numeric(5,2) not null default 0
    check (meta_proximity_score >= 0 and meta_proximity_score <= 100),

  -- Consistency: probability of drawing the core package by turn 3 (0-100).
  consistency_index       numeric(5,2) not null default 0
    check (consistency_index >= 0 and consistency_index <= 100),

  -- Rank within decks sharing the same archetype value (public decks only).
  archetype_popularity_rank integer,
  -- Rank within decks sharing identical color combination (public decks only).
  color_combo_rank          integer,

  -- 7-day rolling trend for the sparkline (['up','flat','down']).
  trend_direction         text         not null default 'flat'
    check (trend_direction in ('up', 'flat', 'down')),

  created_at              timestamptz  not null default now(),
  updated_at              timestamptz  not null default now(),

  unique (deck_id, snapshot_date)
);

create index if not exists idx_deck_analytics_deck_date
  on public.deck_analytics (deck_id, snapshot_date desc);

create index if not exists idx_deck_analytics_date
  on public.deck_analytics (snapshot_date desc);

-- ── deck_card_analytics ───────────────────────────────────────────────────────
-- Per-deck, per-card contribution scoring.
-- Updated whenever the deck's composition is saved/recalculated.

create table if not exists public.deck_card_analytics (
  id                          bigserial primary key,
  deck_id                     uuid        not null references public.decks(id) on delete cascade,
  card_id                     text        not null references public.cards(id) on delete cascade,

  -- What fraction of public decks with the same archetype include this card.
  inclusion_rate_in_archetype numeric(5,4) not null default 0
    check (inclusion_rate_in_archetype >= 0 and inclusion_rate_in_archetype <= 1),

  -- Composite score: inclusion_rate * archetype_win_rate * (4 / copies_needed).
  -- Ranges 0-100.
  performance_score           numeric(7,4) not null default 0
    check (performance_score >= 0),

  trend_direction             text         not null default 'flat'
    check (trend_direction in ('up', 'flat', 'down')),

  updated_at                  timestamptz  not null default now(),

  unique (deck_id, card_id)
);

create index if not exists idx_deck_card_analytics_deck
  on public.deck_card_analytics (deck_id);

create index if not exists idx_deck_card_analytics_card
  on public.deck_card_analytics (card_id);

-- ── updated_at triggers ───────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_deck_analytics_updated_at'
  ) then
    create trigger trg_deck_analytics_updated_at
      before update on public.deck_analytics
      for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'trg_deck_card_analytics_updated_at'
  ) then
    create trigger trg_deck_card_analytics_updated_at
      before update on public.deck_card_analytics
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- ── Row-Level Security ────────────────────────────────────────────────────────

alter table public.deck_analytics enable row level security;
alter table public.deck_card_analytics enable row level security;

-- deck_analytics: readable if deck is public OR requester owns the deck.
create policy "deck_analytics_select"
  on public.deck_analytics for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.decks d
      where d.id = deck_analytics.deck_id
        and (d.is_public = true or d.user_id = auth.uid())
    )
  );

-- deck_analytics: service-role / admin write only.
create policy "deck_analytics_insert"
  on public.deck_analytics for insert
  to service_role
  with check (true);

create policy "deck_analytics_update"
  on public.deck_analytics for update
  to service_role
  using (true);

-- deck_card_analytics: same visibility rules as parent deck.
create policy "deck_card_analytics_select"
  on public.deck_card_analytics for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.decks d
      where d.id = deck_card_analytics.deck_id
        and (d.is_public = true or d.user_id = auth.uid())
    )
  );

create policy "deck_card_analytics_insert"
  on public.deck_card_analytics for insert
  to service_role
  with check (true);

create policy "deck_card_analytics_update"
  on public.deck_card_analytics for update
  to service_role
  using (true);
