/**
 * Deck Loader
 * Loads and prepares decks from database or text input
 */

import {
  validateDeck,
  parseDeckText,
  resolveCardIds,
  DeckValidationResult,
} from './deck-validation';
import type { DeckDefinition } from './game-engine';

export interface DeckLoadOptions {
  loadImages: boolean;
}

export interface LoadedDeck {
  id: string;
  name: string;
  validation: DeckValidationResult;
  definition: DeckDefinition | null;
}

/**
 * Load a deck from database by ID
 */
export async function loadDeckFromDatabase(
  deckId: string,
  cardDatabase: Record<string, any>,
  options: DeckLoadOptions = { loadImages: true },
): Promise<LoadedDeck> {
  // In a real implementation, this would fetch from Supabase
  // For now, return a placeholder
  return {
    id: deckId,
    name: 'Deck Loaded',
    validation: {
      valid: false,
      deckName: 'Deck Loaded',
      mainCount: 0,
      errors: [{ type: 'error', message: 'Database loading not yet implemented' }],
      warnings: [],
      missingCards: [],
      validatedCards: [],
    },
    definition: null,
  };
}

/**
 * Load a deck from paste/text input
 * Supports multiple formats:
 *   4x Card Name
 *   Card Name (qty: 4)
 *   Card Name 4
 */
export async function loadDeckFromText(
  deckText: string,
  cardDatabase: Record<string, any>,
  deckName: string = 'Imported Deck',
  options: DeckLoadOptions = { loadImages: true },
): Promise<LoadedDeck> {
  // Parse deck text
  const parsedCards = parseDeckText(deckText);

  if (parsedCards.length === 0) {
    return {
      id: `deck-${Date.now()}`,
      name: deckName,
      validation: {
        valid: false,
        deckName,
        mainCount: 0,
        errors: [{ type: 'error', message: 'No cards found in deck text' }],
        warnings: [],
        missingCards: [],
        validatedCards: [],
      },
      definition: null,
    };
  }

  // Resolve card IDs
  const resolvedCards = resolveCardIds(parsedCards, cardDatabase);

  // Validate
  const validation = validateDeck(resolvedCards, cardDatabase, deckName);

  // Build DeckDefinition if valid
  let definition: DeckDefinition | null = null;
  if (validation.valid || validation.errors.length === 0) {
    definition = {
      id: `deck-${Date.now()}`,
      name: deckName,
      description: `Imported from text on ${new Date().toLocaleDateString()}`,
      cards: validation.validatedCards.map((card) => ({
        cardId: card.cardId,
        count: card.count,
        zone: 'main' as const,
      })),
    };
  }

  return {
    id: definition?.id || `deck-${Date.now()}`,
    name: deckName,
    validation,
    definition,
  };
}

/**
 * Check if deck has all required image URLs
 */
export function checkDeckImages(
  definition: DeckDefinition,
  cardDatabase: Record<string, any>,
): { hasAllImages: boolean; missingImageCards: string[] } {
  const missingImageCards: string[] = [];

  for (const deckCard of definition.cards) {
    const cardDef = cardDatabase[deckCard.cardId];
    if (!cardDef || !cardDef.imageUrl) {
      missingImageCards.push(deckCard.cardId);
    }
  }

  return {
    hasAllImages: missingImageCards.length === 0,
    missingImageCards,
  };
}

/**
 * Get formatted deck summary for display
 */
export function getDeckSummary(loaded: LoadedDeck): string {
  let summary = `**${loaded.name}**\n`;
  summary += `ID: ${loaded.id}\n`;

  if (loaded.validation.valid) {
    summary += `✅ Status: Valid\n`;
  } else {
    summary += `❌ Status: Invalid\n`;
  }

  summary += `Cards: ${loaded.validation.mainCount} / 60\n`;

  if (loaded.validation.errors.length > 0) {
    summary += `\nErrors (${loaded.validation.errors.length}):\n`;
    for (const error of loaded.validation.errors.slice(0, 3)) {
      summary += `  • ${error.message}\n`;
    }
    if (loaded.validation.errors.length > 3) {
      summary += `  ... and ${loaded.validation.errors.length - 3} more\n`;
    }
  }

  if (loaded.validation.warnings.length > 0) {
    summary += `\nWarnings (${loaded.validation.warnings.length}):\n`;
    for (const warning of loaded.validation.warnings.slice(0, 2)) {
      summary += `  • ${warning.message}\n`;
    }
  }

  return summary;
}

/**
 * Prepare deck for playtesting
 * Ensures all images are available and cards are valid
 */
export interface DeckReadiness {
  ready: boolean;
  status: 'valid' | 'invalid' | 'missing-images' | 'empty';
  message: string;
}

export function checkDeckReadiness(
  loaded: LoadedDeck,
  cardDatabase: Record<string, any>,
): DeckReadiness {
  if (!loaded.definition || loaded.validation.validatedCards.length === 0) {
    return {
      ready: false,
      status: 'empty',
      message: 'Deck is empty. No cards to play.',
    };
  }

  if (!loaded.validation.valid) {
    const errorCount = loaded.validation.errors.length;
    return {
      ready: false,
      status: 'invalid',
      message: `Deck has ${errorCount} validation error${errorCount !== 1 ? 's' : ''}. Check errors above.`,
    };
  }

  const imageCheck = checkDeckImages(loaded.definition, cardDatabase);
  if (!imageCheck.hasAllImages) {
    return {
      ready: false,
      status: 'missing-images',
      message: `${imageCheck.missingImageCards.length} card${imageCheck.missingImageCards.length !== 1 ? 's' : ''} missing images: cannot display.`,
    };
  }

  return {
    ready: true,
    status: 'valid',
    message: 'Deck is ready to play!',
  };
}
