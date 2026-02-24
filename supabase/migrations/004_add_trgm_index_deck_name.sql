-- Migration 004: Add trigram index on decks.name for fuzzy search
-- Fixes: ILIKE '%search%' queries were doing sequential scans

create extension if not exists pg_trgm;

create index if not exists idx_decks_name_trgm
  on public.decks using gin (name gin_trgm_ops);
