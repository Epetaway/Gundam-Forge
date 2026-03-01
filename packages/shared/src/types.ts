/** Official Gundam Card Game colors (Rule 2-4-2-1) */
export type CardColor = 'Blue' | 'Green' | 'Red' | 'White' | 'Purple' | 'Colorless';

/** Official Gundam Card Game card types (Rule 3-1) */
export type CardType = 'Unit' | 'Pilot' | 'Command' | 'Base' | 'Resource';

export interface CardPrice {
  market?: number;
  low?: number;
  mid?: number;
  high?: number;
  foil?: number;
}

export interface CardDefinition {
  id: string;
  name: string;
  color: CardColor;
  cost: number;
  type: CardType;
  set: string;
  text?: string;

  // Official Gundam Card Game stats (Rule 2-7, 2-8, 2-9)
  ap?: number;           // Attack Points - offensive strength in battle
  hp?: number;           // Hit Points - defensive strength, destroyed at 0
  level?: number;        // Resource count required to play (defaults to cost)
  traits?: string[];     // Card traits: groups, classes, types (Rule 2-5)
  zone?: string;         // Card zone: Earth, Space, etc. (Rule 2-6)
  linkCondition?: string; // For Units: pilot link condition (Rule 2-12)

  // Pilot modifiers (Rule 2-7-3, 2-8-4)
  apModifier?: number;   // AP bonus when paired with a Unit
  hpModifier?: number;   // HP bonus when paired with a Unit

  // TCG Mechanics keywords for filtering and synergy detection (enriched)
  keywords?: string[];   // e.g., ["repair", "blocker", "high_maneuver"]
  triggers?: string[];   // e.g., ["burst", "deploy", "when_paired"]
  
  // Legacy field (deprecated - use keywords + triggers)
  mechanics?: string[];  // @deprecated Use keywords/triggers instead

  // Enriched metadata for filtering and matching
  normalizedName?: string; // Normalized name for reliable import matching
  clans?: string[];        // Clan/Faction tags extracted from traits, e.g., ["Earth Federation", "Zeon", "AEUG"]
  
  // Zone legality flags (enriched)
  isMainDeck?: boolean;   // Can be included in main deck (Units, Pilots, Commands not marked as EX)
  isResource?: boolean;   // Can be included in resource zone (Resources, Commands, EX cards)
  isExCard?: boolean;     // Is an EX Base or EX Resource card

  // Legacy compatibility
  power?: number;        // Fallback for AP if ap not specified

  // UI/metadata
  placeholderArt?: string;
  imageUrl?: string;
  price?: CardPrice;
}

/** Helper to get a card's effective AP */
export const getCardAP = (card: CardDefinition): number =>
  card.ap ?? card.power ?? 0;

/** Helper to get a card's effective HP */
export const getCardHP = (card: CardDefinition): number =>
  card.hp ?? card.power ?? 0;

/** Helper to get a card's effective level (defaults to cost) */
export const getCardLevel = (card: CardDefinition): number =>
  card.level ?? card.cost;

/**
 * DeckIntent: The strategic choices made during deck creation
 * Maps directly to the 8 mechanics packages from deckIntentPackages config
 * 
 * Used to:
 * - Support initial card catalog filtering in the deck builder
 * - Seed synergy suggestions and deck recommendations
 * - Track player intent for analytics and feature improvements
 */
export interface DeckIntent {
  /** Clan/Faction preference: e.g., ["Earth Federation", "Zeon"] or empty for "Any Clan" */
  clans: string[];

  /** Color selection: exactly 1–2 non-Colorless colors */
  colors: CardColor[];

  /** Selected mechanics packages: e.g., ["hangar-attrition", "shield-pressure"] */
  packages: string[];

  /** Whether to include EX Resource/Base cards (normally excluded from main deck search) */
  includeEX: boolean;

  /** Optional set/format constraint */
  setOrFormatId?: string;
}

