/**
 * Card Classification Utilities
 *
 * Single source of truth for determining a card's deck role.
 * All card filtering, validation, and role determination should delegate to these utilities
 * to ensure consistency across the entire application.
 *
 * Official Gundam Card Game Rules:
 * - Main deck: exactly 50 cards (Units, Pilots, Commands that are not EX)
 * - Resource deck: 0-10 cards (Resources, Bases, and EX cards)
 * - EX cards: Special cards marked by flag, trait, or ID prefix
 */

import type { CardDefinition } from './types';

/**
 * Returns true if card is an EX card (by flag, trait, or ID prefix).
 *
 * EX cards are special cards that cannot be included in the main deck.
 * They are identified by:
 * 1. The isExCard boolean flag
 * 2. Having "EX" in their traits array
 * 3. Having an ID that starts with "EX"
 */
export function isExCard(card: CardDefinition): boolean {
  if (typeof card.isExCard === 'boolean') return card.isExCard;
  if ((card.traits ?? []).some((t) => t.toLowerCase().includes('ex'))) return true;
  return card.id.toLowerCase().startsWith('ex');
}

/**
 * Returns true if card belongs in the Resource deck (not drawn from).
 *
 * Resource cards are placed in a separate zone and provide resources for playing cards.
 * Includes:
 * - Cards with type 'Resource'
 * - Cards with type 'Base'
 * - EX cards (special resources/bases)
 * - Commands (can be used as resources)
 *
 * Note: The isResource flag takes precedence if explicitly set.
 */
export function isResourceCard(card: CardDefinition): boolean {
  if (typeof card.isResource === 'boolean') return card.isResource;
  return card.type === 'Resource' || card.type === 'Base';
}

/**
 * Returns true if card belongs in the main deck (drawable, playable).
 *
 * Main deck cards are the core of the deck - they are shuffled and drawn during gameplay.
 * Includes:
 * - Units (non-EX)
 * - Pilots (non-EX)
 * - Commands (non-EX)
 *
 * Excludes:
 * - EX cards (they go in the resource deck)
 * - Resource cards (separate zone)
 * - Base cards (separate zone)
 *
 * Note: The isMainDeck flag takes precedence if explicitly set.
 */
export function isMainDeckCard(card: CardDefinition): boolean {
  if (typeof card.isMainDeck === 'boolean') return card.isMainDeck;
  const ex = isExCard(card);
  return (card.type === 'Unit' || card.type === 'Pilot' || card.type === 'Command') && !ex;
}
