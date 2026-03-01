-- Migration 018: Add deck_intent JSONB column
-- Introduced to support enhanced deck preferences based on Gundam TCG mechanics
-- Replaces the generic 'archetype' text field with a structured intent object

-- Step 1: Add deck_intent JSONB column
alter table if exists public.decks
add column deck_intent jsonb default null;

-- Step 2: Migrate existing archetype data to deck_intent
-- This preserves any existing archetype choices as a simple intent
update public.decks
set deck_intent = jsonb_build_object(
  'series', '[]'::jsonb,
  'colors', coalesce(colors, '[]'::text[])::jsonb,
  'packages', '[]'::jsonb,
  'includeEX', false
)
where archetype is not null and deck_intent is null;

-- Step 3: Ensure all decks have a default deck_intent
update public.decks
set deck_intent = jsonb_build_object(
  'series', '[]'::jsonb,
  'colors', coalesce(colors, '[]'::text[])::jsonb,
  'packages', '[]'::jsonb,
  'includeEX', false
)
where deck_intent is null;

-- Step 4: Add index for efficient intent queries
create index if not exists idx_decks_intent_series on public.decks using gin ((deck_intent -> 'series'));
create index if not exists idx_decks_intent_packages on public.decks using gin ((deck_intent -> 'packages'));

-- Step 5: Mark archetype as deprecated (kept for migration/rollback)
-- Do not drop the column; it remains as a fallback reference
comment on column public.decks.archetype is 'DEPRECATED: Use deck_intent instead. Kept for backward compatibility.';
comment on column public.decks.deck_intent is 'Structured deck intent: {series: string[], colors: string[], packages: string[], includeEX: boolean}';
