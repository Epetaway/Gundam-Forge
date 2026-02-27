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
  mainDeckCards: number;
  resourceDeckCards: number;
  unknownCardIds: string[];
  colorsUsed: CardColor[];
  colorCounts: Partial<Record<CardColor, number>>;
  typeCounts: Record<string, number>;
  costCurve: Record<number, number>;
  cardCopies: Record<string, number>;
}

export interface DeckValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics: DeckValidationMetrics;
}

/** Official rules: max 4 copies per card number (Rule 2-1-2) */
const DEFAULT_MAX_COPIES_PER_CARD = 4;
/** Official rules: main deck is exactly 50 cards (Rule 6-1-1) */
const MAIN_DECK_SIZE = 50;
/** Official rules: resource deck is exactly 10 cards (Rule 6-1-1) */
const RESOURCE_DECK_SIZE = 10;
/** Official rules: max 2 colors excluding Colorless (Rule 6-1-1-2) */
const MAX_COLORS = 2;

export const validateDeck = (
  deck: DeckCardEntry[],
  cards: CardDefinition[],
  options: ValidateDeckOptions = {}
): DeckValidationResult => {
  const cardsById = new Map(cards.map((card) => [card.id, card]));
  const normalizedDeck = deck
    .map((entry) => ({ cardId: entry.cardId, qty: Math.max(0, Math.floor(entry.qty)) }))
    .filter((entry) => entry.cardId.trim().length > 0 && entry.qty > 0);

  const typeCounts: Record<string, number> = {
    Unit: 0,
    Pilot: 0,
    Command: 0,
    Base: 0,
    Resource: 0,
  };

  const costCurve: Record<number, number> = {};
  const colorCounts: Partial<Record<CardColor, number>> = {};
  const cardCopies: Record<string, number> = {};
  const unknownCardIds = new Set<string>();
  const colors = new Set<CardColor>();

  let totalCards = 0;
  let mainDeckCards = 0;
  let resourceDeckCards = 0;

  for (const entry of normalizedDeck) {
    totalCards += entry.qty;
    cardCopies[entry.cardId] = (cardCopies[entry.cardId] ?? 0) + entry.qty;

    const card = cardsById.get(entry.cardId);
    if (!card) {
      unknownCardIds.add(entry.cardId);
      continue;
    }

    // Separate Resource cards from main deck cards
    if (card.type === 'Resource') {
      resourceDeckCards += entry.qty;
    } else {
      mainDeckCards += entry.qty;
      colors.add(card.color);
      colorCounts[card.color] = (colorCounts[card.color] ?? 0) + entry.qty;
      costCurve[card.cost] = (costCurve[card.cost] ?? 0) + entry.qty;
    }

    typeCounts[card.type] = (typeCounts[card.type] ?? 0) + entry.qty;
  }

  const errors: string[] = [];
  const warnings: string[] = [];

  // Rule 1: Main deck = exactly 50 cards (Rule 6-1-1)
  if (mainDeckCards !== MAIN_DECK_SIZE) {
    errors.push(`Main deck must contain exactly ${MAIN_DECK_SIZE} cards (currently ${mainDeckCards}).`);
  }

  // Rule 2: Resource deck = exactly 10 cards (Rule 6-1-1)
  if (resourceDeckCards > 0 && resourceDeckCards !== RESOURCE_DECK_SIZE) {
    errors.push(`Resource deck must contain exactly ${RESOURCE_DECK_SIZE} cards (currently ${resourceDeckCards}).`);
  }

  // Rule 3: Maximum 2 colors excluding Colorless (Rule 6-1-1-2)
  const colorsUsed = [...colors].sort();
  const nonColorlessColors = colorsUsed.filter(c => c !== 'Colorless');
  if (nonColorlessColors.length > MAX_COLORS) {
    errors.push(`Deck can contain at most ${MAX_COLORS} colors excluding Colorless (currently ${nonColorlessColors.join(', ')}).`);
  }

  // Rule 4: Unknown card IDs
  if (unknownCardIds.size > 0) {
    errors.push(`Unknown card IDs found: ${[...unknownCardIds].sort().join(', ')}.`);
  }

  // Rule 5: Maximum 4 copies per card (Rule 2-1-2)
  const maxCopiesPerCard = options.maxCopiesPerCard ?? DEFAULT_MAX_COPIES_PER_CARD;
  for (const [cardId, qty] of Object.entries(cardCopies)) {
    if (qty > maxCopiesPerCard) {
      errors.push(`Card ${cardId} exceeds max copies (${qty}/${maxCopiesPerCard}).`);
    }
  }

  // Warnings
  if (mainDeckCards > 0 && typeCounts.Unit < 15) {
    warnings.push(`Consider adding more Unit cards (currently ${typeCounts.Unit}, recommend at least 15).`);
  }

  if (resourceDeckCards === 0 && mainDeckCards > 0) {
    warnings.push(`No Resource cards in deck. The simulator will generate placeholder resources.`);
  }

  // Warning: deck should include exactly 1 Base card
  if (mainDeckCards > 0 && (typeCounts.Base ?? 0) === 0) {
    warnings.push('Deck has no Base card. Each deck typically requires exactly 1 Base.');
  } else if ((typeCounts.Base ?? 0) > 1) {
    warnings.push(`Deck has ${typeCounts.Base} Base cards — only 1 is allowed.`);
  }

  if (mainDeckCards > 0) {
    const avgCost = Object.entries(costCurve).reduce((sum, [cost, count]) =>
      sum + (parseInt(cost) * count), 0) / mainDeckCards;
    if (avgCost > 4.5) {
      warnings.push(`Average card cost is high (${avgCost.toFixed(1)}). Consider adding lower-cost cards.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    metrics: {
      totalCards,
      mainDeckCards,
      resourceDeckCards,
      unknownCardIds: [...unknownCardIds].sort(),
      colorsUsed,
      colorCounts,
      typeCounts,
      costCurve,
      cardCopies
    }
  };
};
