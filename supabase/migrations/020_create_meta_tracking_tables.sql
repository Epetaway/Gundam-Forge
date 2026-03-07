-- Migration 020: Create meta tracking tables
-- Adds explicit storage for archetype trend snapshots and card-level performance.

create table if not exists public.meta_snapshots (
  id              bigserial primary key,
  snapshot_date   date not null,
  meta_version    text not null,
  source          text not null default 'community-api',
  top_5_archetypes text[] not null default '{}',
  notes           text,
  created_at      timestamptz not null default now(),
  unique(snapshot_date, meta_version)
);

create table if not exists public.archetype_stats_history (
  id                bigserial primary key,
  archetype_id      text not null references public.archetypes(id) on delete cascade,
  snapshot_id       bigint not null references public.meta_snapshots(id) on delete cascade,
  meta_rank         integer not null check (meta_rank > 0),
  win_rate          numeric(5,4) check (win_rate >= 0 and win_rate <= 1),
  play_rate         numeric(5,4) check (play_rate >= 0 and play_rate <= 1),
  weighted_score    numeric(10,4) not null default 0,
  trend_direction   text not null default 'flat' check (trend_direction in ('up', 'flat', 'down')),
  created_at        timestamptz not null default now(),
  unique(archetype_id, snapshot_id)
);

create table if not exists public.card_performance (
  id                bigserial primary key,
  card_id           text not null references public.cards(id) on delete cascade,
  archetype_id      text not null references public.archetypes(id) on delete cascade,
  snapshot_id       bigint not null references public.meta_snapshots(id) on delete cascade,
  inclusion_rate    numeric(5,4) check (inclusion_rate >= 0 and inclusion_rate <= 1),
  win_impact        numeric(7,4),
  sample_size       integer not null default 0 check (sample_size >= 0),
  created_at        timestamptz not null default now(),
  unique(card_id, archetype_id, snapshot_id)
);

create index if not exists idx_meta_snapshots_date on public.meta_snapshots(snapshot_date desc);
create index if not exists idx_archetype_stats_history_archetype on public.archetype_stats_history(archetype_id, snapshot_id);
create index if not exists idx_archetype_stats_history_rank on public.archetype_stats_history(meta_rank);
create index if not exists idx_card_performance_card on public.card_performance(card_id, snapshot_id);
create index if not exists idx_card_performance_archetype on public.card_performance(archetype_id, snapshot_id);

alter table public.meta_snapshots enable row level security;
alter table public.archetype_stats_history enable row level security;
alter table public.card_performance enable row level security;

-- Public read access for trend display.
create policy "Meta snapshots are publicly readable"
  on public.meta_snapshots for select
  to anon, authenticated
  using (true);

create policy "Archetype stats history is publicly readable"
  on public.archetype_stats_history for select
  to anon, authenticated
  using (true);

create policy "Card performance is publicly readable"
  on public.card_performance for select
  to anon, authenticated
  using (true);

-- Moderator/admin write access for ingestion pipeline.
create policy "Moderators can write meta snapshots"
  on public.meta_snapshots for all
  to authenticated
  using (public.has_role('moderator'))
  with check (public.has_role('moderator'));

create policy "Moderators can write archetype stats history"
  on public.archetype_stats_history for all
  to authenticated
  using (public.has_role('moderator'))
  with check (public.has_role('moderator'));

create policy "Moderators can write card performance"
  on public.card_performance for all
  to authenticated
  using (public.has_role('moderator'))
  with check (public.has_role('moderator'));
