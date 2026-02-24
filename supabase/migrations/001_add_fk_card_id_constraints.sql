-- Migration 001: Add foreign key constraints on card_id columns
-- Fixes: deck_cards.card_id and user_collections.card_id had no referential integrity

alter table public.deck_cards
  add constraint fk_deck_cards_card_id
  foreign key (card_id) references public.cards(id);

alter table public.user_collections
  add constraint fk_user_collections_card_id
  foreign key (card_id) references public.cards(id);
