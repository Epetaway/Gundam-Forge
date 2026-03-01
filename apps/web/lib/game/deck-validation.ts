/**
 * Deck Validation Engine
 * Enforces official Gundam TCG deck construction rules
 */

import { DECK_RULES, VALIDATION_ERRORS } from './rules-constants';

export interface DeckCard {
  cardId: string;
  name: string;
  count: number;
  imageUrl?: string;
}

export interface DeckValidationResult {
  valid: boolean;
  deckName: string;
  mainCount: number;
  errors: ValidationError[];
  warnings: ValidationError[];
  missingCards: DeckCard[];
  validatedCards: DeckCard[];
}

export interface ValidationError {
  type: 'error' | 'warning';
  message: string;
  cardId?: string;
  count?: number;
}

/**
 * Validate a deck against official rules
 */
export function validateDeck(
  cards: DeckCard[],
  cardDatabase: Record<string, any>,
  deckName: string = 'Untitled Deck',
): DeckValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const missingCards: DeckCard[] = [];
  const validatedCards: DeckCard[] = [];

  let totalCards = 0;
  const cardCounts: Record<string, number> = {};
  const cardsNeedingImages: DeckCard[] = [];

  // Rule 1: Check deck size
  for (const card of cards) {
    totalCards += card.count;
    cardCounts[card.cardId] = (cardCounts[card.cardId] || 0) + card.count;
  }

  if (totalCards !== DECK_RULES.mainDeckSize) {
    errors.push({
      type: 'error',
      message: `${VALIDATION_ERRORS.DECK_SIZE_INVALID} (current: ${totalCards})`,
    });
  }

  // Rule 2: Check copy limits
  for (const [cardId, count] of Object.entries(cardCounts)) {
    if (count > DECK_RULES.maxCopiesPerCard) {
      const card = cards.find((c) => c.cardId === cardId);
      errors.push({
        type: 'error',
        message: `${VALIDATION_ERRORS.COPY_LIMIT_EXCEEDED}: ${card?.name || cardId} (${count} copies)`,
        cardId,
        count,
      });
    }
  }

  // Rule 3: Resolve cards and check for missing images
  for (const card of cards) {
    const cardDb = cardDatabase[card.cardId];

    if (!cardDb) {
      errors.push({
        type: 'error',
        message: `${VALIDATION_ERRORS.CARD_NOT_FOUND}: ${card.cardId}`,
        cardId: card.cardId,
      });
      missingCards.push(card);
      continue;
    }

    // Check for image URL
    const imageUrl = card.imageUrl || cardDb.imageUrl;
    if (!imageUrl) {
      errors.push({
        type: 'error',
        message: `${VALIDATION_ERRORS.IMAGE_URL_MISSING}: ${cardDb.name} (${card.cardId})`,
        cardId: card.cardId,
      });
      cardsNeedingImages.push({
        ...card,
        name: cardDb.name,
        imageUrl: undefined,
      });
      continue;
    }

    validatedCards.push({
      ...card,
      name: cardDb.name,
      imageUrl,
    });
  }

  // Rule 4: Unit card recommendation
  const unitCount = cards.filter((c) => {
    const cardDef = cardDatabase[c.cardId];
    return cardDef?.type === 'Unit';
  }).length;

  if (unitCount < DECK_RULES.minUnitCards) {
    warnings.push({
      type: 'warning',
      message: `Deck has fewer than recommended unit cards (${unitCount} / ${DECK_RULES.minUnitCards})`,
    });
  }

  const isValid = errors.length === 0 && totalCards === DECK_RULES.mainDeckSize;

  return {
    valid: isValid,
    deckName,
    mainCount: validatedCards.reduce((sum, c) => sum + c.count, 0),
    errors,
    warnings,
    missingCards,
    validatedCards,
  };
}

/**
 * Parse deck text format
 * Supports formats like:
 *   4x Card Name
 *   Card Name (qty: 4)
 *   Card Name 4
 */
export function parseDeckText(deckText: string): DeckCard[] {
  const cards: DeckCard[] = [];
  const lines = deckText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('//') && !line.startsWith('#'));

  for (const line of lines) {
    const parsed = parseDeckLine(line);
    if (parsed) {
      cards.push(parsed);
    }
  }

  return cards;
}

/**
 * Parse a single deck line
 */
function parseDeckLine(line: string): DeckCard | null {
  // Format: "4x Card Name"
  let match = line.match(/^(\d+)x?\s+(.+)$/i);
  if (match) {
    return {
      cardId: match[2].trim(),
      name: match[2].trim(),
      count: parseInt(match[1], 10),
    };
  }

  // Format: "Card Name (qty: 4)"
  match = line.match(/^(.+?)\s*\(qty:\s*(\d+)\s*\)$/i);
  if (match) {
    return {
      cardId: match[1].trim(),
      name: match[1].trim(),
      count: parseInt(match[2], 10),
    };
  }

  // Format: "Card Name 4"
  match = line.match(/^(.+?)\s+(\d+)$/);
  if (match) {
    return {
      cardId: match[1].trim(),
      name: match[1].trim(),
      count: parseInt(match[2], 10),
    };
  }

  // Single copy
  if (line && line.length > 0) {
    return {
      cardId: line,
      name: line,
      count: 1,
    };
  }

  return null;
}

/**
 * Resolve card IDs from card names using database
 * Performs fuzzy matching for player-entered names
 */
export function resolveCardIds(
  cards: DeckCard[],
  cardDatabase: Record<string, any>,
): DeckCard[] {
  const resolved: DeckCard[] = [];

  for (const card of cards) {
    // If cardId exists in database, use it as-is
    if (cardDatabase[card.cardId]) {
      resolved.push(card);
      continue;
    }

    // Try to find by name (exact match first)
    const exactMatch = Object.values(cardDatabase).find(
      (c: any) => c.name.toLowerCase() === card.name.toLowerCase(),
    );

    if (exactMatch) {
      resolved.push({
        ...card,
        cardId: exactMatch.id,
        name: exactMatch.name,
        imageUrl: exactMatch.imageUrl || card.imageUrl,
      });
      continue;
    }

    // Try fuzzy match on name
    const fuzzyMatch = fuzzyFindCard(card.name, cardDatabase);
    if (fuzzyMatch) {
      resolved.push({
        ...card,
        cardId: fuzzyMatch.id,
        name: fuzzyMatch.name,
        imageUrl: fuzzyMatch.imageUrl || card.imageUrl,
      });
      continue;
    }

    // No match found - keep original
    resolved.push(card);
  }

  return resolved;
}

/**
 * Fuzzy card name matching
 * Uses Levenshtein distance for name similarity
 */
function fuzzyFindCard(
  name: string,
  cardDatabase: Record<string, any>,
  threshold: number = 0.8,
): any | null {
  const cards = Object.values(cardDatabase);
  let bestMatch: any = null;
  let bestScore = threshold;

  for (const card of cards) {
    const score = levenshteinSimilarity(name.toLowerCase(), card.name.toLowerCase());
    if (score > bestScore) {
      bestScore = score;
      bestMatch = card;
    }
  }

  return bestMatch;
}

/**
 * Calculate Levenshtein similarity (0 to 1)
 */
function levenshteinSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1, str2);
  const maxLen = Math.max(str1.length, str2.length);
  return maxLen === 0 ? 1 : 1 - distance / maxLen;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1, // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Create a readable validation report
 */
export function formatValidationReport(result: DeckValidationResult): string {
  let report = `\n=== DECK VALIDATION: ${result.deckName} ===\n`;

  if (result.valid) {
    report += '✅ DECK VALID\n';
  } else {
    report += '❌ DECK INVALID\n';
  }

  report += `\nCards: ${result.mainCount} / ${DECK_RULES.mainDeckSize}\n`;

  if (result.errors.length > 0) {
    report += '\n⚠️  ERRORS:\n';
    for (const error of result.errors) {
      report += `  • ${error.message}\n`;
    }
  }

  if (result.warnings.length > 0) {
    report += '\n⚠️  WARNINGS:\n';
    for (const warning of result.warnings) {
      report += `  • ${warning.message}\n`;
    }
  }

  if (result.missingCards.length > 0) {
    report += '\n❌ MISSING CARDS:\n';
    for (const card of result.missingCards) {
      report += `  • ${card.cardId} (${card.count})\n`;
    }
  }

  report += '\n';
  return report;
}
