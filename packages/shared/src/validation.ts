import type { CardColor, CardDefinition, CardType } from './types';

export interface DeckCardEntry {
  cardId: string;
  qty: number;
}

export interface ValidateDeckOptions {
  maxCopiesPerCard?: number;
}

export interface DeckValidationMetrics {
  totalCards: number;
  unknownCardIds: string[];
  colorsUsed: CardColor[];
  colorCounts: Partial<Record<CardColor, number>>;
  typeCounts: Record<CardType, number>;
  costCurve: Record<number, number>;
  cardCopies: Record<string, number>;
}

export interface DeckValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics: DeckValidationMetrics;
}

const DEFAULT_MAX_COPIES_PER_CARD = 3; // Official rule: max 3 copies per card
const EXACT_DECK_SIZE = 60; // Official rule: exactly 60 cards
const MAX_COLORS = 2; // Official rule: max 2 colors (excluding Colorless)

export const validateDeck = (
  deck: DeckCardEntry[],
  cards: CardDefinition[],
  options: ValidateDeckOptions = {}
): DeckValidationResult => {
  const cardsById = new Map(cards.map((card) => [card.id, card]));
  const normalizedDeck = deck
    .map((entry) => ({ cardId: entry.cardId, qty: Math.max(0, Math.floor(entry.qty)) }))
    .filter((entry) => entry.cardId.trim().length > 0 && entry.qty > 0);

  const typeCounts: Record<CardType, number> = {
    Unit: 0,
    Pilot: 0,
    Command: 0,
    Base: 0
  };

  const costCurve: Record<number, number> = {};
  const colorCounts: Partial<Record<CardColor, number>> = {};
  const cardCopies: Record<string, number> = {};
  const unknownCardIds = new Set<string>();
  const colors = new Set<CardColor>();

  let totalCards = 0;

  for (const entry of normalizedDeck) {
    totalCards += entry.qty;
    cardCopies[entry.cardId] = (cardCopies[entry.cardId] ?? 0) + entry.qty;

    const card = cardsById.get(entry.cardId);
    if (!card) {
      unknownCardIds.add(entry.cardId);
      continue;
    }

    colors.add(card.color);
    colorCounts[card.color] = (colorCounts[card.color] ?? 0) + entry.qty;
    typeCounts[card.type] += entry.qty;
    costCurve[card.cost] = (costCurve[card.cost] ?? 0) + entry.qty;
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Rule 1: Exactly 60 cards
  if (totalCards !== EXACT_DECK_SIZE) {
    errors.push(`Deck must contain exactly ${EXACT_DECK_SIZE} cards (currently ${totalCards}).`);
  }

  // Rule 2: Maximum 2 colors (excluding Colorless)
  const colorsUsed = [...colors].sort();
  const nonColorlessColors = colorsUsed.filter(c => c !== 'Colorless');
  if (nonColorlessColors.length > MAX_COLORS) {
    errors.push(`Deck can contain at most ${MAX_COLORS} colors excluding Colorless (currently ${nonColorlessColors.join(', ')}).`);
  }

  // Rule 3: Unknown card IDs
  if (unknownCardIds.size > 0) {
    errors.push(`Unknown card IDs found: ${[...unknownCardIds].sort().join(', ')}.`);
  }

  // Rule 4: Maximum copies per card (default 3)
  const maxCopiesPerCard = options.maxCopiesPerCard ?? DEFAULT_MAX_COPIES_PER_CARD;

  for (const [cardId, qty] of Object.entries(cardCopies)) {
    if (qty > maxCopiesPerCard) {
      errors.push(`Card ${cardId} exceeds max copies (${qty}/${maxCopiesPerCard}).`);
    }
  }

  // Warning: Deck composition recommendations
  if (typeCounts.Unit < 15) {
    warnings.push(`Consider adding more Unit cards (currently ${typeCounts.Unit}, recommend at least 15).`);
  }

  const avgCost = Object.entries(costCurve).reduce((sum, [cost, count]) => 
    sum + (parseInt(cost) * count), 0) / totalCards;
  if (avgCost > 4.5) {
    warnings.push(`Average card cost is high (${avgCost.toFixed(1)}). Consider adding lower-cost cards.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metrics: {
      totalCards,
      unknownCardIds: [...unknownCardIds].sort(),
      colorsUsed,
      colorCounts,
      typeCounts,
      costCurve,
      cardCopies
    }
  };
};
