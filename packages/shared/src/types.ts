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

  // TCG Mechanics keywords for filtering and synergy detection (enriched by scripts/enrich-keywords.mjs)
  /** Intrinsic mechanic keywords. Normalized lowercase, with value where applicable.
   *  e.g. ["blocker", "repair 1", "support 3", "breach 2", "first-strike", "high-maneuver", "suppression"] */
  keywords?: string[];
  /** Timing trigger types the card has effects for.
   *  e.g. ["burst", "when-paired", "during-pair", "during-link", "deploy", "attack", "destroyed", "activate"] */
  triggers?: string[];
  /** Clan/trait qualifiers for When Paired / During Pair effects (Units only).
   *  e.g. ["(ZAFT)", "(Coordinator)", "Red", "Lv.4+"] — empty means works with any pilot */
  pairQualifiers?: string[];

  // Legacy field (deprecated - use keywords + triggers)
  mechanics?: string[];  // @deprecated Use keywords/triggers instead

  // Enriched metadata for filtering and matching
  normalizedName?: string; // Normalized name for reliable import matching
  clans?: string[];        // Clan/Faction tags extracted from traits, e.g., ["Earth Federation", "Zeon", "AEUG"]
  
  // Zone legality flags (enriched)
  isMainDeck?: boolean;   // Can be included in main deck (Units, Pilots, Commands not marked as EX)
  isResource?: boolean;   // Can be included in resource zone (Resources, Commands, EX cards)
  isExCard?: boolean;     // Is an EX Base or EX Resource card

  // Format legality
  legalities?: Record<string, 'legal' | 'banned' | 'restricted' | 'suspended'>;
  // Examples: { standard: 'legal', extended: 'banned', vintage: 'restricted' }
  // 'restricted' = can only play 1 copy (vs max 4 normally)

  // Availability metadata
  availability?: {
    /** Print count / print number in set (e.g., 1, 2 for reprints) */
    print?: number;
    /** Rarity: C (Common), R (Rare), SR (Special Rare), P (Promo) */
    rarity?: 'C' | 'R' | 'SR' | 'P';
  };

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
 * Extract numeric value from a keyword string.
 * Examples:
 *   - getKeywordValue({ keywords: ['repair 1'] }, 'repair') → 1
 *   - getKeywordValue({ keywords: ['support 3'] }, 'support') → 3
 *   - getKeywordValue({ keywords: ['blocker'] }, 'blocker') → 1 (default)
 *   - getKeywordValue({ keywords: [] }, 'unknown') → 0 (not found)
 */
export const getKeywordValue = (
  card: CardDefinition,
  keywordName: string,
  defaultValue: number = 1
): number => {
  if (!card.keywords || card.keywords.length === 0) {
    return 0;
  }

  const match = card.keywords.find((k) =>
    k.toLowerCase().startsWith(keywordName.toLowerCase())
  );

  if (!match) {
    return 0;
  }

  // If keyword is just the name (e.g., "blocker"), return default
  if (match.toLowerCase() === keywordName.toLowerCase()) {
    return defaultValue;
  }

  // Extract numeric suffix (e.g., "repair 2" → 2)
  const numeric = match.match(/\d+$/);
  return numeric ? parseInt(numeric[0], 10) : defaultValue;
};

/**
 * Check if a card has a specific keyword (case-insensitive prefix match).
 * Examples:
 *   - hasKeyword({ keywords: ['repair 2'] }, 'repair') → true
 *   - hasKeyword({ keywords: ['blocker'] }, 'blocker') → true
 *   - hasKeyword({ keywords: [] }, 'any') → false
 */
export const hasKeyword = (card: CardDefinition, keywordName: string): boolean => {
  if (!card.keywords || card.keywords.length === 0) {
    return false;
  }

  return card.keywords.some((k) =>
    k.toLowerCase().startsWith(keywordName.toLowerCase())
  );
};

/**
 * Check if a card is legal in a specific format.
 * Examples:
 *   - isLegalInFormat({ legalities: { standard: 'legal' } }, 'standard') → true
 *   - isLegalInFormat({ legalities: { standard: 'banned' } }, 'standard') → false
 *   - isLegalInFormat({}, 'any-format') → true (default: assume legal if not specified)
 */
export const isLegalInFormat = (
  card: CardDefinition,
  formatId: string,
  assumeLegalIfNotSpecified: boolean = true
): boolean => {
  if (!card.legalities) {
    return assumeLegalIfNotSpecified;
  }

  const status = card.legalities[formatId];
  if (!status) {
    return assumeLegalIfNotSpecified;
  }

  return status === 'legal' || status === 'restricted';
};

/**
 * Get the copy limit for a card in a specific format.
 * Examples:
 *   - getCopyLimit({ legalities: { standard: 'legal' } }, 'standard') → 4 (default max)
 *   - getCopyLimit({ legalities: { standard: 'restricted' } }, 'standard') → 1
 *   - getCopyLimit({ legalities: { standard: 'banned' } }, 'standard') → 0
 */
export const getCopyLimit = (
  card: CardDefinition,
  formatId: string
): number => {
  if (!card.legalities) {
    return 4; // Default max copies
  }

  const status = card.legalities[formatId.toLowerCase()] ||
    card.legalities[formatId.toUpperCase()] ||
    card.legalities[formatId];

  if (!status) {
    return 4; // Default max copies if format not specified
  }

  switch (status) {
    case 'legal':
      return 4;
    case 'restricted':
      return 1;
    case 'suspended':
    case 'banned':
      return 0;
    default:
      return 4;
  }
};

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

/** CardLookup: Typed lookup for card definitions by card ID */
export type CardLookup = Map<string, CardDefinition>;

/** ZoneProps: Base props interface shared by all playground zone components */
export interface ZoneProps {
  isOpponent?: boolean;
  cardLookup: CardLookup;
}

