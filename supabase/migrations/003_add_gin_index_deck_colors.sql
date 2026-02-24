-- Migration 003: Add GIN index on decks.colors for array containment queries
-- Fixes: color filtering via @> (contains) was doing sequential scans

create index if not exists idx_decks_colors_gin on public.decks using gin (colors);
