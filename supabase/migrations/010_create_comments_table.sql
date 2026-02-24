-- Migration 010: Create comments table
-- Enables community interaction on public decks

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

-- Anyone can read comments on public decks
create policy "Comments on public decks are readable"
  on public.comments for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.decks
      where id = deck_id and is_public = true
    )
  );

-- Authenticated users can create comments
create policy "Authenticated users can create comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own comments
create policy "Users can update their own comments"
  on public.comments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own comments
create policy "Users can delete their own comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = user_id);

create trigger trg_comments_updated_at
  before update on public.comments
  for each row
  execute function public.update_updated_at();
