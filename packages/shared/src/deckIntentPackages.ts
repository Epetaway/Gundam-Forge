/**
 * Gundam TCG Deck Intent Packages
 * Maps game mechanics research to practical deckbuilding packages
 * Each package represents a strategic engine based on official keywords/triggers
 * 
 * Source: Gundam Card Game mechanics research (keywords, triggers, timing)
 */

import type { CardColor } from './types';

/** Non-colorless colors for package affinity */
type PackageColor = Exclude<CardColor, 'Colorless'>;

export interface DeckIntentPackage {
  /** Unique identifier for the package */
  id: string;

  /** Display name (user-facing) */
  label: string;

  /** 1-sentence description referencing keyword/timing concepts */
  description: string;

  /** TCG mechanics keywords this package includes */
  mechanicsTags: string[];

  /** Timing/trigger concepts for UI reference */
  triggerTags: string[];

  /** Primary colors: Colors with strong support for this package (3+ cards) */
  primaryColors?: PackageColor[];

  /** Secondary colors: Colors with some support for this package (1-2 cards) */
  secondaryColors?: PackageColor[];
}

/**
 * Core packages derived from Gundam TCG mechanics research
 * These are the 8 primary strategic engines available to players
 */
export const DECK_INTENT_PACKAGES: Record<string, DeckIntentPackage> = {
  'hangar-attrition': {
    id: 'hangar-attrition',
    label: 'Hangar Attrition',
    description:
      'End-turn sustain and shield defense using Repair to heal, Blocker to redirect attacks, and Burst shields for reactive value.',
    mechanicsTags: ['repair', 'blocker', 'burst'],
    triggerTags: ['end_turn', 'shield_value', 'sustained_defense'],
    primaryColors: ['Blue', 'Green'],
    secondaryColors: ['White'],
  },

  'shield-pressure': {
    id: 'shield-pressure',
    label: 'Shield Pressure',
    description:
      'Break through shields and damage base by combining Breach (shield sabotage on KO) and Suppression (double-shield damage).',
    mechanicsTags: ['breach', 'suppression'],
    triggerTags: ['kill_trigger', 'shield_damage', 'multi_shield_break'],
    primaryColors: ['Red', 'Green'],
    secondaryColors: ['White'],
  },

  'buff-chain-support': {
    id: 'buff-chain-support',
    label: 'Buff Chain Support',
    description:
      'Amplify your units through Activate:Main rest-to-buff Support effects, enabling kill payoffs and synergy chains.',
    mechanicsTags: ['support', 'activate_main'],
    triggerTags: ['main_phase', 'attack_amplification', 'kill_enablement'],
    primaryColors: ['White', 'Blue'],
    secondaryColors: ['Green'],
  },

  'ace-sync': {
    id: 'ace-sync',
    label: 'Ace Sync',
    description:
      'Execute powerful pair/link strategies using When Paired, During Pair, When Linked, and During Link effects for bonus AP and triggers.',
    mechanicsTags: ['paired', 'link'],
    triggerTags: ['pair_trigger', 'link_trigger', 'pilot_synergy'],
    primaryColors: ['Red', 'Purple', 'Blue'],
    secondaryColors: ['White'],
  },

  'tempo-deploy': {
    id: 'tempo-deploy',
    label: 'Tempo Deploy',
    description:
      'Build tempo by chaining Deploy triggers that search, summon, or generate advantage when units enter the battlefield.',
    mechanicsTags: ['deploy'],
    triggerTags: ['on_deploy', 'tempo_chain', 'unit_search'],
    primaryColors: ['Blue', 'Green', 'White'],
    secondaryColors: ['Red'],
  },

  'attack-value-engine': {
    id: 'attack-value-engine',
    label: 'Attack Value Engine',
    description:
      'Generate card advantage and resources from Attack triggers that fire whenever your units declare attacks during the Attack Step.',
    mechanicsTags: ['attack_trigger'],
    triggerTags: ['on_attack', 'draw_engine', 'resource_generation'],
    primaryColors: ['Red', 'Purple'],
    secondaryColors: ['Blue', 'Green'],
  },

  'action-step-tricks': {
    id: 'action-step-tricks',
    label: 'Action Step Tricks',
    description:
      'Control the board reactively using Activate:Action effects and instant-speed tricks during the Action Step.',
    mechanicsTags: ['activate_action'],
    triggerTags: ['action_step_timing', 'reactive_play', 'instant_tricks'],
    primaryColors: ['Blue', 'Red'],
    secondaryColors: ['Purple', 'White'],
  },

  'evasion-and-preempt': {
    id: 'evasion-and-preempt',
    label: 'Evasion & Preempt',
    description:
      'Win trades and bypass enemy blockers using High-Maneuver (unblockable attacks) and First Strike (guaranteed first damage).',
    mechanicsTags: ['high_maneuver', 'first_strike'],
    triggerTags: ['bypass_blocker', 'first_damage', 'direct_attack'],
    primaryColors: ['Red', 'Purple', 'Green'],
    secondaryColors: ['Blue'],
  },
};

/**
 * Get a specific package by ID
 */
export function getPackageById(id: string): DeckIntentPackage | undefined {
  return DECK_INTENT_PACKAGES[id];
}

/**
 * Get all available packages
 */
export function getAllPackages(): DeckIntentPackage[] {
  return Object.values(DECK_INTENT_PACKAGES);
}

/**
 * Get packages by IDs
 */
export function getPackagesByIds(ids: string[]): DeckIntentPackage[] {
  return ids
    .map((id) => getPackageById(id))
    .filter((pkg): pkg is DeckIntentPackage => pkg !== undefined);
}

/**
 * Flatten all mechanics tags from selected packages
 * Useful for filtering card catalogs by mechanic
 */
export function getMechanicsFromPackages(packageIds: string[]): string[] {
  const packages = getPackagesByIds(packageIds);
  const tagSet = new Set<string>();
  packages.forEach((pkg) => pkg.mechanicsTags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet);
}

/**
 * Flatten all trigger tags from selected packages
 * Useful for UI hints and recommendation reasons
 */
export function getTriggersFromPackages(packageIds: string[]): string[] {
  const packages = getPackagesByIds(packageIds);
  const tagSet = new Set<string>();
  packages.forEach((pkg) => pkg.triggerTags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet);
}

/**
 * Filter packages based on selected colors
 * Returns packages that have at least some card support in the selected colors
 * 
 * @param selectedColors - Colors selected by the user
 * @param strictMode - If true, only return packages with primary color support
 * @returns Filtered list of packages
 */
export function filterPackagesByColors(
  selectedColors: CardColor[],
  strictMode: boolean = false,
): DeckIntentPackage[] {
  if (selectedColors.length === 0) {
    return getAllPackages();
  }

  const nonColorless = selectedColors.filter((c): c is PackageColor => c !== 'Colorless');
  if (nonColorless.length === 0) {
    return getAllPackages();
  }

  return getAllPackages().filter((pkg) => {
    const primaryMatch = pkg.primaryColors?.some((c) => nonColorless.includes(c));
    const secondaryMatch = pkg.secondaryColors?.some((c) => nonColorless.includes(c));
    
    if (strictMode) {
      return primaryMatch;
    }
    
    return primaryMatch || secondaryMatch;
  });
}

/**
 * Get support level for a package given selected colors
 * Returns 'strong', 'moderate', 'limited', or 'none'
 */
export function getPackageSupportLevel(
  pkg: DeckIntentPackage,
  selectedColors: CardColor[],
): 'strong' | 'moderate' | 'limited' | 'none' {
  const nonColorless = selectedColors.filter((c): c is PackageColor => c !== 'Colorless');
  
  if (nonColorless.length === 0) {
    return 'moderate';
  }

  const primaryMatches = pkg.primaryColors?.filter((c) => nonColorless.includes(c)).length ?? 0;
  const secondaryMatches = pkg.secondaryColors?.filter((c) => nonColorless.includes(c)).length ?? 0;

  if (primaryMatches >= 2) return 'strong';
  if (primaryMatches === 1) return 'moderate';
  if (secondaryMatches > 0) return 'limited';
  return 'none';
}
