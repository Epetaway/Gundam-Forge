-- Migration 005: Add full-text search vector to cards table
-- Enables server-side card search via tsvector instead of client-side JSON filtering

alter table public.cards
  add column search_vector tsvector
  generated always as (
    to_tsvector('english',
      coalesce(name, '') || ' ' ||
      coalesce(text, '') || ' ' ||
      coalesce(array_to_string(traits, ' '), '')
    )
  ) stored;

create index if not exists idx_cards_search
  on public.cards using gin (search_vector);

-- Also add trigram index on card name for partial/fuzzy matches
create index if not exists idx_cards_name_trgm
  on public.cards using gin (name gin_trgm_ops);
