-- ============================================================
-- Gundam Forge — Supabase Schema
-- Run this in the Supabase SQL Editor to set up all tables.
-- ============================================================

-- Extensions
create extension if not exists pg_trgm;

-- ============================================================
-- Shared utility functions (must be created before triggers)
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1. Cards table (read-only reference data)
create table if not exists public.cards (
  id          text primary key,
  name        text not null,
  color       text not null check (color in ('Blue','Green','Red','White','Purple','Colorless')),
  cost        integer not null default 0,
  type        text not null check (type in ('Unit','Pilot','Command','Base','Resource')),
  set         text not null,
  text        text,
  ap          integer,
  hp          integer,
  level       integer,
  traits      text[],
  zone        text,
  link_condition text,
  ap_modifier integer,
  hp_modifier integer,
  power       integer,
  placeholder_art text,
  image_url   text,
  rarity      text,
  illustrator text,
  release_date date,
  search_vector tsvector generated always as (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(text, '') || ' ' ||
      coalesce(array_to_string(traits, ' '), '')
    )
  ) stored,
  created_at  timestamptz not null default now()
);

-- 2. Card prices
create table if not exists public.card_prices (
  card_id     text primary key references public.cards(id) on delete cascade,
  market      numeric(10,2),
  low         numeric(10,2),
  mid         numeric(10,2),
  high        numeric(10,2),
  foil        numeric(10,2),
  updated_at  timestamptz not null default now()
);

-- 3. Profiles (public user info)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    text unique,
  display_name text,
  avatar_url  text,
  bio         text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- 3b. Archetypes (normalized meta archetype reference)
create table if not exists public.archetypes (
  id          text primary key,
  name        text not null,
  colors      text[] not null,
  tier        smallint check (tier between 1 and 4),
  description text,
  key_cards   text[] not null default '{}',
  highlights  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.archetypes enable row level security;

create policy "Archetypes are publicly readable"
  on public.archetypes for select
  to anon, authenticated
  using (true);

create trigger trg_archetypes_updated_at
  before update on public.archetypes
  for each row
  execute function public.update_updated_at();

-- 4. Decks (user-owned and official)
create table if not exists public.decks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,  -- NULL for official decks
  name        text not null default 'Untitled Deck',
  description text,
  is_public   boolean not null default false,
  view_count  integer not null default 0,
  like_count  integer not null default 0,
  colors      text[] not null default '{}',
  format      text not null default 'standard',
  archetype   text,
  source      text not null default 'user' check (source in ('user', 'official')),
  source_url  text,
  slug        text unique,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 5. Deck cards (junction table)
create table if not exists public.deck_cards (
  id          uuid primary key default gen_random_uuid(),
  deck_id     uuid not null references public.decks(id) on delete cascade,
  card_id     text not null references public.cards(id),
  qty         integer not null default 1 check (qty > 0 and qty <= 4),
  is_boss     boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (deck_id, card_id)
);

-- Indexes
create index if not exists idx_decks_user_id on public.decks(user_id);
create index if not exists idx_decks_updated_at on public.decks(updated_at desc);
create index if not exists idx_decks_public on public.decks(is_public) where is_public = true;
create index if not exists idx_decks_view_count on public.decks(view_count desc) where is_public = true;
create index if not exists idx_decks_like_count on public.decks(like_count desc) where is_public = true;
create index if not exists idx_decks_archetype on public.decks(archetype) where archetype is not null;
create index if not exists idx_decks_source on public.decks(source);
create index if not exists idx_decks_slug on public.decks(slug) where slug is not null;
create index if not exists idx_decks_colors_gin on public.decks using gin (colors);
create index if not exists idx_decks_name_trgm on public.decks using gin (name gin_trgm_ops);
create index if not exists idx_deck_cards_deck_id on public.deck_cards(deck_id);
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_cards_search on public.cards using gin (search_vector);
create index if not exists idx_cards_name_trgm on public.cards using gin (name gin_trgm_ops);

-- 5b. Deck likes (user-to-deck many-to-many)
create table if not exists public.deck_likes (
  user_id     uuid not null references auth.users(id) on delete cascade,
  deck_id     uuid not null references public.decks(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, deck_id)
);

create index if not exists idx_deck_likes_deck_id on public.deck_likes(deck_id);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.cards enable row level security;
alter table public.card_prices enable row level security;
alter table public.profiles enable row level security;
alter table public.decks enable row level security;
alter table public.deck_cards enable row level security;
alter table public.deck_likes enable row level security;

-- Cards: readable by everyone (public reference data)
create policy "Cards are readable by everyone"
  on public.cards for select
  to authenticated, anon
  using (true);

-- Card prices: readable by everyone
create policy "Card prices are readable by everyone"
  on public.card_prices for select
  to authenticated, anon
  using (true);

-- Profiles: readable by everyone, editable by owner
create policy "Profiles are readable by everyone"
  on public.profiles for select
  to authenticated, anon
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Decks: users can CRUD their own decks
create policy "Users can view their own decks"
  on public.decks for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can view public decks"
  on public.decks for select
  to authenticated, anon
  using (is_public = true);

create policy "Users can create their own decks"
  on public.decks for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own decks"
  on public.decks for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own decks"
  on public.decks for delete
  to authenticated
  using (auth.uid() = user_id);

-- Deck cards: inherit access from parent deck
create policy "Users can view their own deck cards"
  on public.deck_cards for select
  to authenticated
  using (
    exists (
      select 1 from public.decks
      where decks.id = deck_cards.deck_id
        and decks.user_id = auth.uid()
    )
  );

create policy "Users can view public deck cards"
  on public.deck_cards for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.decks
      where decks.id = deck_cards.deck_id
        and decks.is_public = true
    )
  );

create policy "Users can insert their own deck cards"
  on public.deck_cards for insert
  to authenticated
  with check (
    exists (
      select 1 from public.decks
      where decks.id = deck_cards.deck_id
        and decks.user_id = auth.uid()
    )
  );

create policy "Users can update their own deck cards"
  on public.deck_cards for update
  to authenticated
  using (
    exists (
      select 1 from public.decks
      where decks.id = deck_cards.deck_id
        and decks.user_id = auth.uid()
    )
  );

create policy "Users can delete their own deck cards"
  on public.deck_cards for delete
  to authenticated
  using (
    exists (
      select 1 from public.decks
      where decks.id = deck_cards.deck_id
        and decks.user_id = auth.uid()
    )
  );

-- Official decks: visible to everyone (user_id is NULL)
create policy "Official decks are visible to everyone"
  on public.decks for select
  to authenticated, anon
  using (source = 'official');

create policy "Official deck cards are visible to everyone"
  on public.deck_cards for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.decks
      where decks.id = deck_cards.deck_id
        and decks.source = 'official'
    )
  );

-- Deck likes: anyone can view, authenticated users can insert/delete their own
create policy "Anyone can view deck likes"
  on public.deck_likes for select
  to authenticated, anon
  using (true);

create policy "Users can like decks"
  on public.deck_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can unlike decks"
  on public.deck_likes for delete
  to authenticated
  using (auth.uid() = user_id);

create trigger trg_decks_updated_at
  before update on public.decks
  for each row
  execute function public.update_updated_at();

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at();

-- ============================================================
-- Auto-generate deck slug from name
-- ============================================================
create or replace function public.generate_deck_slug()
returns trigger as $$
declare
  base_slug text;
  final_slug text;
  counter integer := 0;
begin
  if new.slug is null and new.name is not null then
    base_slug := lower(regexp_replace(
      regexp_replace(new.name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '[\s-]+', '-', 'g'
    ));
    base_slug := trim(both '-' from base_slug);
    final_slug := base_slug;
    loop
      exit when not exists (
        select 1 from public.decks where slug = final_slug and id != new.id
      );
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    end loop;
    new.slug := final_slug;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_decks_generate_slug
  before insert or update of name on public.decks
  for each row
  execute function public.generate_deck_slug();

-- ============================================================
-- 6. User card collections (owned cards)
-- ============================================================
create table if not exists public.user_collections (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  card_id     text not null references public.cards(id),
  qty         integer not null default 1 check (qty > 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, card_id)
);

create index if not exists idx_user_collections_user_id on public.user_collections(user_id);

alter table public.user_collections enable row level security;

create policy "Users can view their own collection"
  on public.user_collections for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can add to their own collection"
  on public.user_collections for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own collection"
  on public.user_collections for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can remove from their own collection"
  on public.user_collections for delete
  to authenticated
  using (auth.uid() = user_id);

create trigger trg_user_collections_updated_at
  before update on public.user_collections
  for each row
  execute function public.update_updated_at();

-- ============================================================
-- 7. Events (tournaments, locals, online)
-- ============================================================
create table if not exists public.events (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique not null,
  event_type    text not null check (event_type in ('regional','national','local','online')),
  date          date not null,
  location      text,
  player_count  integer,
  source_url    text,
  created_at    timestamptz not null default now()
);

create index if not exists idx_events_date on public.events(date desc);
create index if not exists idx_events_slug on public.events(slug);
create index if not exists idx_events_type on public.events(event_type);

alter table public.events enable row level security;

create policy "Events are publicly readable"
  on public.events for select
  to anon, authenticated
  using (true);

-- ============================================================
-- 8. Event placements (deck results at events)
-- ============================================================
create table if not exists public.event_placements (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  deck_id       uuid references public.decks(id) on delete set null,
  player_name   text,
  placement     integer not null,
  archetype_id  text references public.archetypes(id),
  wins          integer not null default 0,
  losses        integer not null default 0,
  draws         integer not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists idx_event_placements_event on public.event_placements(event_id);
create index if not exists idx_event_placements_archetype on public.event_placements(archetype_id);
create index if not exists idx_event_placements_deck on public.event_placements(deck_id);
create index if not exists idx_event_placements_placement on public.event_placements(placement);

alter table public.event_placements enable row level security;

create policy "Event placements are publicly readable"
  on public.event_placements for select
  to anon, authenticated
  using (true);

-- ============================================================
-- 9. Tags (taxonomy system)
-- ============================================================
create table if not exists public.tags (
  id          text primary key,
  label       text not null,
  category    text not null check (category in ('strategy','series','mechanic')),
  created_at  timestamptz not null default now()
);

-- 9b. Deck tags (junction)
create table if not exists public.deck_tags (
  deck_id     uuid not null references public.decks(id) on delete cascade,
  tag_id      text not null references public.tags(id) on delete cascade,
  primary key (deck_id, tag_id)
);

create index if not exists idx_deck_tags_tag on public.deck_tags(tag_id);

alter table public.tags enable row level security;
alter table public.deck_tags enable row level security;

create policy "Tags are publicly readable"
  on public.tags for select
  to anon, authenticated
  using (true);

create policy "Deck tags are publicly readable"
  on public.deck_tags for select
  to anon, authenticated
  using (true);

create policy "Deck owners can add tags"
  on public.deck_tags for insert
  to authenticated
  with check (
    exists (
      select 1 from public.decks
      where id = deck_id and user_id = auth.uid()
    )
  );

create policy "Deck owners can remove tags"
  on public.deck_tags for delete
  to authenticated
  using (
    exists (
      select 1 from public.decks
      where id = deck_id and user_id = auth.uid()
    )
  );

-- ============================================================
-- 10. Comments (on public decks)
-- ============================================================
create table if not exists public.comments (
  id          uuid primary key default gen_random_uuid(),
  deck_id     uuid not null references public.decks(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  body        text not null check (length(body) between 1 and 2000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_comments_deck on public.comments(deck_id);
create index if not exists idx_comments_user on public.comments(user_id);
create index if not exists idx_comments_created on public.comments(created_at desc);

alter table public.comments enable row level security;

create policy "Comments on public decks are readable"
  on public.comments for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.decks
      where id = deck_id and is_public = true
    )
  );

create policy "Authenticated users can create comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own comments"
  on public.comments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id);

create trigger trg_comments_updated_at
  before update on public.comments
  for each row
  execute function public.update_updated_at();

-- ============================================================
-- Increment view count (called via RPC from the client)
-- ============================================================
create or replace function public.increment_deck_view(deck_id uuid)
returns void as $$
begin
  update public.decks
  set view_count = view_count + 1
  where id = deck_id and is_public = true;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Toggle deck like (called via RPC from the client)
-- Atomically likes/unlikes and updates denormalized count.
-- ============================================================
create or replace function public.toggle_deck_like(target_deck_id uuid)
returns json as $$
declare
  v_user_id uuid := auth.uid();
  v_liked boolean;
  v_like_count integer;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Check if like exists
  if exists (
    select 1 from public.deck_likes
    where user_id = v_user_id and deck_id = target_deck_id
  ) then
    -- Unlike
    delete from public.deck_likes
    where user_id = v_user_id and deck_id = target_deck_id;
    v_liked := false;
  else
    -- Like
    insert into public.deck_likes (user_id, deck_id)
    values (v_user_id, target_deck_id);
    v_liked := true;
  end if;

  -- Update denormalized count
  update public.decks
  set like_count = (
    select count(*) from public.deck_likes where deck_id = target_deck_id
  )
  where id = target_deck_id;

  -- Return new state
  select d.like_count into v_like_count
  from public.decks d where d.id = target_deck_id;

  return json_build_object('liked', v_liked, 'like_count', v_like_count);
end;
$$ language plpgsql security definer;

-- ============================================================
-- Atomic save deck cards (called via RPC from the client)
-- Replaces non-atomic delete-then-insert pattern.
-- ============================================================
create or replace function public.save_deck_cards(
  p_deck_id uuid,
  p_cards jsonb  -- [{card_id, qty, is_boss}, ...]
)
returns void as $$
begin
  -- Verify ownership
  if not exists (
    select 1 from public.decks
    where id = p_deck_id and user_id = auth.uid()
  ) then
    raise exception 'Not authorized';
  end if;

  -- Atomic: delete + insert in a single transaction
  delete from public.deck_cards where deck_id = p_deck_id;

  insert into public.deck_cards (deck_id, card_id, qty, is_boss)
  select
    p_deck_id,
    elem->>'card_id',
    (elem->>'qty')::integer,
    coalesce((elem->>'is_boss')::boolean, false)
  from jsonb_array_elements(p_cards) as elem
  where (elem->>'qty')::integer > 0;

  -- Touch updated_at
  update public.decks set updated_at = now() where id = p_deck_id;
end;
$$ language plpgsql security definer;

-- ============================================================
-- Archetype stats materialized view (win rate aggregation)
-- ============================================================
create materialized view if not exists public.archetype_stats as
select
  a.id as archetype_id,
  a.name,
  a.colors,
  a.tier as base_tier,
  count(ep.id) as total_placements,
  count(ep.id) filter (where ep.placement = 1) as first_place_count,
  count(ep.id) filter (where ep.placement <= 3) as top_3_count,
  coalesce(avg(ep.placement)::numeric(5,2), 0) as avg_placement,
  case
    when sum(ep.wins + ep.losses + ep.draws) > 0
    then (sum(ep.wins)::numeric / sum(ep.wins + ep.losses + ep.draws))::numeric(5,4)
    else 0
  end as win_rate,
  coalesce(sum(
    case
      when e.date > current_date - interval '90 days' then 1.0
      when e.date > current_date - interval '180 days' then 0.5
      else 0.25
    end
  ), 0)::numeric(8,2) as weighted_score,
  count(distinct e.id) filter (where e.date > current_date - interval '90 days') as recent_event_count
from public.archetypes a
left join public.event_placements ep on ep.archetype_id = a.id
left join public.events e on e.id = ep.event_id
group by a.id, a.name, a.colors, a.tier;

create unique index if not exists idx_archetype_stats_id
  on public.archetype_stats(archetype_id);

-- Refresh function (call from cron or admin)
create or replace function public.refresh_archetype_stats()
returns void as $$
begin
  refresh materialized view concurrently public.archetype_stats;
end;
$$ language plpgsql security definer;
