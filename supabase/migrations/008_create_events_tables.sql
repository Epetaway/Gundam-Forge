-- Migration 008: Create events and event_placements tables
-- Enables tournament tracking and win rate aggregation

-- Events table
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

-- Anyone can read events
create policy "Events are publicly readable"
  on public.events for select
  to anon, authenticated
  using (true);

-- Event placements table (deck results at events)
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

-- Anyone can read placements
create policy "Event placements are publicly readable"
  on public.event_placements for select
  to anon, authenticated
  using (true);
