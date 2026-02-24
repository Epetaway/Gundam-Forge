/**
 * Predefined deck archetypes for the Gundam Card Game.
 * Users can pick from this list or type a custom archetype (max 40 chars).
 */
export const PREDEFINED_ARCHETYPES = [
  // Color-based strategies
  'Blue Tempo',
  'Blue/White Midrange',
  'Blue/Green Breach',
  'Blue/Red Midrange',
  'Red Aggro',
  'Red/White Aggro',
  'Red/Blue Control',
  'Green Ramp',
  'Green/White Ramp',
  'White Weenie',
  'Purple Control',
  'Purple/Green Midrange',

  // Series / Faction archetypes
  'Tekkadan Aggro',
  'Qubeley Control',
  'Celestial Being',
  'SEED',
  'Neo Zeon',
  'Titans',
  'AEUG',
  'Earth Federation',
  'ZAFT',
  'Operation Meteor',
  'Jupitris',

  // Strategy archetypes
  'Aggro',
  'Midrange',
  'Control',
  'Combo',
  'Ramp',
] as const;

export type PredefinedArchetype = (typeof PREDEFINED_ARCHETYPES)[number];

export const MAX_ARCHETYPE_LENGTH = 40;
