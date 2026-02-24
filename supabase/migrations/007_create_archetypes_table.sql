-- Migration 007: Create archetypes table (normalized)
-- Replaces hardcoded archetype strings with a proper reference table

create table if not exists public.archetypes (
  id          text primary key,           -- e.g. 'wing-zero'
  name        text not null,
  colors      text[] not null,
  tier        smallint check (tier between 1 and 4),
  description text,
  key_cards   text[] not null default '{}',
  highlights  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.archetypes enable row level security;

-- Anyone can read archetypes
create policy "Archetypes are publicly readable"
  on public.archetypes for select
  to anon, authenticated
  using (true);

create trigger trg_archetypes_updated_at
  before update on public.archetypes
  for each row
  execute function public.update_updated_at();

-- Seed from the current static META_TIER_LIST
insert into public.archetypes (id, name, colors, tier, description, key_cards, highlights)
values
  ('wing-zero', 'Wing Zero (Green-White)', '{Green,White}', 1,
   'The most represented archetype in tournament top cuts. A ramp strategy that builds resources to deploy Wing Gundam Zero and other high-level finishers.',
   '{GD02-079,GD01-066}',
   'Took 9 of 16 pods in Tokyo qualifiers, won TAK Games Oceania and Bristol Regionals.'),

  ('zeon-rush', 'Zeon Rush (Blue-Green)', '{Blue,Green}', 1,
   'Extremely consistent aggro-breach strategy with over 45 cards in common across lists. Posts steady results throughout the meta.',
   '{ST01-015,GD01-100}',
   'Very steady for the entire Dual Impact metagame with consistent results.'),

  ('seed-freedom', 'Seed Freedom (Blue-White)', '{Blue,White}', 1,
   'Control/midrange deck that leverages Freedom Gundam and blocker synergies. Needs innovation to stay on top.',
   '{GD02-002,GD01-065}',
   'Won EU Championship. Aggro variant took home the Regional in Brazil.'),

  ('cyber-newtype', 'Cyber Newtype (Blue-Red)', '{Blue,Red}', 2,
   'Emerging contender that deals damage while recovering to gain advantage. Multiple sub-archetypes including Aegis Aggro.',
   '{GD02-036}',
   'Took 1st, 2nd, and 4th at Orlando tournament. Absent from EU championship finals.'),

  ('barbatos-synergy', 'Barbatos Synergy (Blue-Purple)', '{Blue,Purple}', 3,
   'Self-damage synergy deck that grew weaker as the meta shifted. Lost momentum in December.',
   '{}',
   'Won two Tokyo Qualifiers, placed 2nd/3rd at TAK Games Oceania. Absent from December EU top 8.'),

  ('seed-aggro', 'SEED Aggro (Red-White)', '{Red,White}', 3,
   'A reactive positioning deck with ZAFT offense and Earth Alliance defense. A step behind the top tier.',
   '{ST03-013,GD01-111}',
   'Solid but struggles to pressure top tier decks consistently.'),

  ('zeon-ping', 'Zeon Ping (Green-Red)', '{Green,Red}', 4,
   'Damage-based control using Zeon units. Won an early Tokyo qualifier but has fallen off significantly.',
   '{}',
   'Won one Tokyo qualifier, only store-level wins since. Needs next set for viability.')
on conflict (id) do update set
  name = excluded.name,
  colors = excluded.colors,
  tier = excluded.tier,
  description = excluded.description,
  key_cards = excluded.key_cards,
  highlights = excluded.highlights,
  updated_at = now();
