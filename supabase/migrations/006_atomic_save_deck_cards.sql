-- Migration 006: Atomic save_deck_cards RPC function
-- Fixes: Non-atomic delete-then-insert pattern that could lose cards on failure

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
