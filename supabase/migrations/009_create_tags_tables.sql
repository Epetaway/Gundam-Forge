-- Migration 009: Create tags and deck_tags tables
-- Provides a flexible taxonomy system for decks

create table if not exists public.tags (
  id          text primary key,           -- e.g. 'aggro', 'combo', 'newtype'
  label       text not null,
  category    text not null check (category in ('strategy','series','mechanic')),
  created_at  timestamptz not null default now()
);

create table if not exists public.deck_tags (
  deck_id     uuid not null references public.decks(id) on delete cascade,
  tag_id      text not null references public.tags(id) on delete cascade,
  primary key (deck_id, tag_id)
);

create index if not exists idx_deck_tags_tag on public.deck_tags(tag_id);

alter table public.tags enable row level security;
alter table public.deck_tags enable row level security;

-- Anyone can read tags
create policy "Tags are publicly readable"
  on public.tags for select
  to anon, authenticated
  using (true);

-- Anyone can read deck tags
create policy "Deck tags are publicly readable"
  on public.deck_tags for select
  to anon, authenticated
  using (true);

-- Deck owners can manage tags on their decks
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

-- Seed initial tags from the existing card-schema.ts tag enum
insert into public.tags (id, label, category) values
  ('aggro', 'Aggro', 'strategy'),
  ('control', 'Control', 'strategy'),
  ('combo', 'Combo', 'strategy'),
  ('midrange', 'Midrange', 'strategy'),
  ('ramp', 'Ramp', 'strategy'),
  ('newtype', 'Newtype', 'mechanic'),
  ('zeon', 'Zeon', 'series'),
  ('federation', 'Federation', 'series'),
  ('mobile-suit', 'Mobile Suit', 'mechanic'),
  ('wing-gundam', 'Wing Gundam', 'series'),
  ('gundam-seed', 'Gundam SEED', 'series'),
  ('gundam-00', 'Gundam 00', 'series'),
  ('gundam-ibo', 'Gundam IBO', 'series'),
  ('uc-era', 'UC Era', 'series'),
  ('breach', 'Breach', 'mechanic'),
  ('blocker', 'Blocker', 'mechanic')
on conflict (id) do nothing;
