-- ============================================================
-- Gundam Forge — Supabase Schema
-- Run this in the Supabase SQL Editor to set up all tables.
-- ============================================================

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

-- 4. Decks (user-owned)
create table if not exists public.decks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null default 'Untitled Deck',
  description text,
  is_public   boolean not null default false,
  view_count  integer not null default 0,
  colors      text[] not null default '{}',
  format      text not null default 'standard',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 5. Deck cards (junction table)
create table if not exists public.deck_cards (
  id          uuid primary key default gen_random_uuid(),
  deck_id     uuid not null references public.decks(id) on delete cascade,
  card_id     text not null,
  qty         integer not null default 1 check (qty > 0 and qty <= 4),
  created_at  timestamptz not null default now(),
  unique (deck_id, card_id)
);

-- Indexes
create index if not exists idx_decks_user_id on public.decks(user_id);
create index if not exists idx_decks_updated_at on public.decks(updated_at desc);
create index if not exists idx_decks_public on public.decks(is_public) where is_public = true;
create index if not exists idx_decks_view_count on public.decks(view_count desc) where is_public = true;
create index if not exists idx_deck_cards_deck_id on public.deck_cards(deck_id);
create index if not exists idx_profiles_username on public.profiles(username);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.cards enable row level security;
alter table public.card_prices enable row level security;
alter table public.profiles enable row level security;
alter table public.decks enable row level security;
alter table public.deck_cards enable row level security;

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

-- ============================================================
-- Updated_at trigger for decks
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_decks_updated_at
  before update on public.decks
  for each row
  execute function public.update_updated_at();

create trigger trg_profiles_updated_at
  before update on public.profiles
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
