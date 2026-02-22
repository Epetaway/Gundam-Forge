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

const DEFAULT_MAX_COPIES_WARNING = 4;

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

  if (totalCards !== 60) {
    errors.push(`Deck must contain exactly 60 cards (currently ${totalCards}).`);
  }

  const colorsUsed = [...colors].sort();
  if (colorsUsed.length > 2) {
    errors.push(`Deck can contain at most 2 colors (currently ${colorsUsed.join(', ')}).`);
  }

  if (unknownCardIds.size > 0) {
    errors.push(`Unknown card IDs found: ${[...unknownCardIds].sort().join(', ')}.`);
  }

  const maxCopiesPerCard = options.maxCopiesPerCard;

  for (const [cardId, qty] of Object.entries(cardCopies)) {
    if (typeof maxCopiesPerCard === 'number') {
      if (qty > maxCopiesPerCard) {
        errors.push(`Card ${cardId} exceeds max copies (${qty}/${maxCopiesPerCard}).`);
      }
    } else if (qty > DEFAULT_MAX_COPIES_WARNING) {
      warnings.push(`Card ${cardId} has ${qty} copies (soft warning over ${DEFAULT_MAX_COPIES_WARNING}).`);
    }
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
