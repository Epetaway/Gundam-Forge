/**
 * Meta tier list data sourced from https://gundamcard.gg/tier-list/
 * GD02 "Dual Impact" metagame analysis.
 */

export type MetaTier = 1 | 2 | 3 | 4;

export interface MetaArchetype {
  /** Display name for this meta archetype */
  name: string;
  /** Tier ranking (1 = best, 4 = worst) */
  tier: MetaTier;
  /** Color combination */
  colors: string[];
  /** Brief meta summary */
  summary: string;
  /** Notable card IDs mentioned in the tier list */
  keyCards: string[];
  /** Tournament highlights */
  highlights: string;
}

export const META_TIER_LIST: MetaArchetype[] = [
  // ── Tier 1 ──
  {
    name: 'Wing Zero (Green-White)',
    tier: 1,
    colors: ['Green', 'White'],
    summary:
      'The most represented archetype in tournament top cuts. A ramp strategy that builds resources to deploy Wing Gundam Zero and other high-level finishers.',
    keyCards: ['GD02-079', 'GD01-066'],
    highlights:
      'Took 9 of 16 pods in Tokyo qualifiers, won TAK Games Oceania and Bristol Regionals.',
  },
  {
    name: 'Zeon Rush (Blue-Green)',
    tier: 1,
    colors: ['Blue', 'Green'],
    summary:
      'Extremely consistent aggro-breach strategy with over 45 cards in common across lists. Posts steady results throughout the meta.',
    keyCards: ['ST01-015', 'GD01-100'],
    highlights:
      'Very steady for the entire Dual Impact metagame with consistent results.',
  },
  {
    name: 'Seed Freedom (Blue-White)',
    tier: 1,
    colors: ['Blue', 'White'],
    summary:
      'Control/midrange deck that leverages Freedom Gundam and blocker synergies. Needs innovation to stay on top.',
    keyCards: ['GD02-002', 'GD01-065'],
    highlights:
      'Won EU Championship. Aggro variant took home the Regional in Brazil.',
  },

  // ── Tier 2 ──
  {
    name: 'Cyber Newtype (Blue-Red)',
    tier: 2,
    colors: ['Blue', 'Red'],
    summary:
      'Emerging contender that deals damage while recovering to gain advantage. Multiple sub-archetypes including Aegis Aggro.',
    keyCards: ['GD02-036'],
    highlights:
      'Took 1st, 2nd, and 4th at Orlando tournament. Absent from EU championship finals.',
  },

  // ── Tier 3 ──
  {
    name: 'Barbatos Synergy (Blue-Purple)',
    tier: 3,
    colors: ['Blue', 'Purple'],
    summary:
      'Self-damage synergy deck that grew weaker as the meta shifted. Lost momentum in December.',
    keyCards: [],
    highlights:
      'Won two Tokyo Qualifiers, placed 2nd/3rd at TAK Games Oceania. Absent from December EU top 8.',
  },
  {
    name: 'SEED Aggro (Red-White)',
    tier: 3,
    colors: ['Red', 'White'],
    summary:
      'A reactive positioning deck with ZAFT offense and Earth Alliance defense. A step behind the top tier.',
    keyCards: ['ST03-013', 'GD01-111'],
    highlights:
      'Solid but struggles to pressure top tier decks consistently.',
  },

  // ── Tier 4 ──
  {
    name: 'Zeon Ping (Green-Red)',
    tier: 4,
    colors: ['Green', 'Red'],
    summary:
      'Damage-based control using Zeon units. Won an early Tokyo qualifier but has fallen off significantly.',
    keyCards: [],
    highlights:
      'Won one Tokyo qualifier, only store-level wins since. Needs next set for viability.',
  },
];

/** Look up the best matching meta tier for a deck based on its colors */
export function getMetaTierForColors(colors: string[]): MetaArchetype | undefined {
  if (colors.length === 0) return undefined;
  const sorted = [...colors].filter((c) => c !== 'Colorless').sort();
  return META_TIER_LIST.find((m) => {
    const mSorted = [...m.colors].sort();
    return mSorted.length === sorted.length && mSorted.every((c, i) => c === sorted[i]);
  });
}

/** Tier label mapping */
export const TIER_LABELS: Record<MetaTier, string> = {
  1: 'S',
  2: 'A',
  3: 'B',
  4: 'C',
};

/** Tier color classes for badges */
export const TIER_COLORS: Record<MetaTier, string> = {
  1: 'bg-amber-100 border-amber-300 text-amber-800',
  2: 'bg-sky-100 border-sky-300 text-sky-800',
  3: 'bg-emerald-100 border-emerald-300 text-emerald-800',
  4: 'bg-zinc-100 border-zinc-300 text-zinc-600',
};
