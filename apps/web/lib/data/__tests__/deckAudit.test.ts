import { describe, it, expect } from 'vitest';
import type { CardDefinition, CardColor } from '@gundam-forge/shared';
import catalogCards from '@/lib/data/cards.catalog.json';
import liveDecks from '@/lib/data/decks-live.json';

const allCards = catalogCards as CardDefinition[];
const cardsById = new Map(allCards.map((c) => [c.id, c]));

describe('deck-live.json audit', () => {
  const decks = liveDecks as Array<{
    id: string;
    name: string;
    colors: CardColor[];
    entries: Array<{ cardId: string; qty: number }>;
  }>;

  it('every live deck has no unknown card IDs', () => {
    for (const deck of decks) {
      const unknowns = deck.entries
        .filter((e) => !cardsById.has(e.cardId))
        .map((e) => e.cardId);
      expect(unknowns, `Deck ${deck.id} has unknown card IDs: ${unknowns.join(', ')}`).toHaveLength(0);
    }
  });

  it('no deck has a card with qty > 4', () => {
    for (const deck of decks) {
      for (const entry of deck.entries) {
        expect(
          entry.qty,
          `Deck ${deck.id} card ${entry.cardId} has qty ${entry.qty} > 4`,
        ).toBeLessThanOrEqual(4);
      }
    }
  });
});
