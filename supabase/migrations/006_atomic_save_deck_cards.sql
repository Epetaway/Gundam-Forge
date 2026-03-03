-- Migration 006: Atomic save_deck_cards RPC function
-- Fixes: Non-atomic delete-then-insert pattern that could lose cards on failure
-- Note: Supports up to 50 main deck + up to 10 resource deck cards
--   Optional side deck: 0-15 cards max
--   Validation in validate-deck function enforces limits per official rules

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
