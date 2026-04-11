-- Migration 023: Playtester replay and post-game metrics persistence

create table if not exists public.playtester_replays (
  game_id        text primary key,
  deck_id        text not null,
  replay_version text not null,
  replay         jsonb not null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.playtester_metrics (
  game_id     text primary key,
  deck_id     text not null,
  metrics     jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_playtester_replays_deck_id
  on public.playtester_replays(deck_id);

create index if not exists idx_playtester_metrics_deck_id
  on public.playtester_metrics(deck_id);

create trigger trg_playtester_replays_updated_at
  before update on public.playtester_replays
  for each row execute function public.update_updated_at();

create trigger trg_playtester_metrics_updated_at
  before update on public.playtester_metrics
  for each row execute function public.update_updated_at();

alter table public.playtester_replays enable row level security;
alter table public.playtester_metrics enable row level security;

create policy "Playtester replays are readable"
  on public.playtester_replays for select
  to anon, authenticated
  using (true);

create policy "Playtester metrics are readable"
  on public.playtester_metrics for select
  to anon, authenticated
  using (true);

create policy "Playtester replays are writable"
  on public.playtester_replays for all
  to anon, authenticated
  using (true)
  with check (true);

create policy "Playtester metrics are writable"
  on public.playtester_metrics for all
  to anon, authenticated
  using (true)
  with check (true);
