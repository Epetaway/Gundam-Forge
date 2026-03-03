-- Migration 019: Add side deck support
-- Adds optional side deck table for tournament deck tuning (0-15 cards max)
-- Side deck is independent from main deck (max 50) and resource deck (max 10)

-- Create side deck cards table
create table if not exists public.side_deck_cards (
  id          uuid primary key default gen_random_uuid(),
  deck_id     uuid not null references public.decks(id) on delete cascade,
  card_id     text not null references public.cards(id),
  qty         integer not null default 1 check (qty > 0 and qty <= 4),
  created_at  timestamptz not null default now(),
  unique (deck_id, card_id)
);

-- Enable RLS
alter table public.side_deck_cards enable row level security;

-- Create index
create index if not exists idx_side_deck_cards_deck_id on public.side_deck_cards(deck_id);

-- RLS Policies: Users can view their own side deck cards
create policy "Users can view their own side deck cards"
  on public.side_deck_cards for select
  to authenticated
  using (
    exists (
      select 1 from public.decks
      where decks.id = side_deck_cards.deck_id
        and decks.user_id = auth.uid()
    )
  );

-- RLS: Users can view public decks' side deck
create policy "Users can view public side deck cards"
  on public.side_deck_cards for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.decks
      where decks.id = side_deck_cards.deck_id
        and decks.is_public = true
    )
  );

-- RLS: Users can insert their own side deck cards
create policy "Users can insert their own side deck cards"
  on public.side_deck_cards for insert
  to authenticated
  with check (
    exists (
      select 1 from public.decks
      where decks.id = side_deck_cards.deck_id
        and decks.user_id = auth.uid()
    )
  );

-- RLS: Users can update their own side deck cards
create policy "Users can update their own side deck cards"
  on public.side_deck_cards for update
  to authenticated
  using (
    exists (
      select 1 from public.decks
      where decks.id = side_deck_cards.deck_id
        and decks.user_id = auth.uid()
    )
  );

-- RLS: Users can delete their own side deck cards
create policy "Users can delete their own side deck cards"
  on public.side_deck_cards for delete
  to authenticated
  using (
    exists (
      select 1 from public.decks
      where decks.id = side_deck_cards.deck_id
        and decks.user_id = auth.uid()
    )
  );

-- RLS: Official decks' side decks are visible to everyone
create policy "Official side deck cards are visible to everyone"
  on public.side_deck_cards for select
  to authenticated, anon
  using (
    exists (
      select 1 from public.decks
      where decks.id = side_deck_cards.deck_id
        and decks.source = 'official'
    )
  );

-- Update save_deck_cards function to support side deck
create or replace function public.save_deck_cards(
  p_deck_id uuid,
  p_cards jsonb,  -- [{card_id, qty, is_boss}, ...] - up to 50 main + 10 resource
  p_side_cards jsonb default null  -- [{card_id, qty}, ...] - optional, 0-15 cards max
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

  -- Atomic: delete + insert main/resource deck cards in a single transaction
  delete from public.deck_cards where deck_id = p_deck_id;

  insert into public.deck_cards (deck_id, card_id, qty, is_boss)
  select
    p_deck_id,
    elem->>'card_id',
    (elem->>'qty')::integer,
    coalesce((elem->>'is_boss')::boolean, false)
  from jsonb_array_elements(p_cards) as elem
  where (elem->>'qty')::integer > 0;

  -- Atomically update side deck (if provided)
  if p_side_cards is not null then
    delete from public.side_deck_cards where deck_id = p_deck_id;
    
    insert into public.side_deck_cards (deck_id, card_id, qty)
    select
      p_deck_id,
      elem->>'card_id',
      (elem->>'qty')::integer
    from jsonb_array_elements(p_side_cards) as elem
    where (elem->>'qty')::integer > 0;
  end if;

  -- Touch updated_at
  update public.decks set updated_at = now() where id = p_deck_id;
end;
$$ language plpgsql security definer;
