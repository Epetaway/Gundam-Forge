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
