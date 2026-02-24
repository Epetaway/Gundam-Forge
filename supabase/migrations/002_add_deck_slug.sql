-- Migration 002: Add slug column to decks for SEO-friendly URLs
-- Enables human-readable deck URLs (e.g. /decks/wing-zero-ramp)

alter table public.decks
  add column slug text unique;

-- Index for fast slug lookups
create index if not exists idx_decks_slug on public.decks(slug) where slug is not null;

-- Auto-generate slug from name on insert/update when slug is null
create or replace function public.generate_deck_slug()
returns trigger as $$
declare
  base_slug text;
  final_slug text;
  counter integer := 0;
begin
  -- Only generate if slug is null and name is present
  if new.slug is null and new.name is not null then
    -- Lowercase, replace non-alphanumeric with hyphens, collapse multiples, trim
    base_slug := lower(regexp_replace(
      regexp_replace(new.name, '[^a-zA-Z0-9\s-]', '', 'g'),
      '[\s-]+', '-', 'g'
    ));
    base_slug := trim(both '-' from base_slug);

    -- Ensure uniqueness by appending a counter if needed
    final_slug := base_slug;
    loop
      exit when not exists (
        select 1 from public.decks where slug = final_slug and id != new.id
      );
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    end loop;

    new.slug := final_slug;
  end if;

  return new;
end;
$$ language plpgsql;

create trigger trg_decks_generate_slug
  before insert or update of name on public.decks
  for each row
  execute function public.generate_deck_slug();

-- Backfill slugs for existing decks
update public.decks set slug = null where slug is null;
