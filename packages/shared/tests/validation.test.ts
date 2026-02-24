import { describe, it, expect } from 'vitest';
import { validateDeck } from '../src/validation';
import type { CardDefinition } from '../src/types';

// Helper to create a minimal card
function makeCard(overrides: Partial<CardDefinition> & { id: string }): CardDefinition {
  return {
    name: overrides.id,
    color: 'Blue',
    cost: 2,
    type: 'Unit',
    set: 'TEST-1',
    ...overrides,
  };
}

// Generate N unique cards
function makeCards(n: number, overrides?: Partial<CardDefinition>): CardDefinition[] {
  return Array.from({ length: n }, (_, i) =>
    makeCard({ id: `CARD-${String(i + 1).padStart(3, '0')}`, ...overrides })
  );
}

// Build a deck of exactly `total` cards using 1 copy of each
function makeDeck(cardIds: string[], qty = 1) {
  return cardIds.map((cardId) => ({ cardId, qty }));
}

describe('validateDeck', () => {
  describe('main deck size (Rule 6-1-1)', () => {
    it('returns error when main deck has fewer than 50 cards', () => {
      const cards = makeCards(10);
      const deck = makeDeck(cards.map((c) => c.id));
      const result = validateDeck(deck, cards);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('exactly 50 cards')])
      );
      expect(result.metrics.mainDeckCards).toBe(10);
    });

    it('returns error when main deck has more than 50 cards', () => {
      const cards = makeCards(51);
      const deck = makeDeck(cards.map((c) => c.id));
      const result = validateDeck(deck, cards);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('exactly 50 cards')])
      );
    });

    it('passes when main deck has exactly 50 cards', () => {
      const cards = makeCards(50);
      const deck = makeDeck(cards.map((c) => c.id));
      const result = validateDeck(deck, cards);

      // Only deck size error should be absent; other warnings may exist
      const sizeErrors = result.errors.filter((e) => e.includes('50 cards'));
      expect(sizeErrors).toHaveLength(0);
      expect(result.metrics.mainDeckCards).toBe(50);
    });
  });

  describe('color limit (Rule 6-1-1-2)', () => {
    it('allows 2 non-Colorless colors', () => {
      const blueCards = makeCards(25, { color: 'Blue' });
      const redCards = makeCards(25, { color: 'Red' }).map((c, i) => ({
        ...c,
        id: `RED-${i}`,
      }));
      const allCards = [...blueCards, ...redCards];
      const deck = makeDeck(allCards.map((c) => c.id));
      const result = validateDeck(deck, allCards);

      const colorErrors = result.errors.filter((e) => e.includes('colors'));
      expect(colorErrors).toHaveLength(0);
    });

    it('errors on 3+ non-Colorless colors', () => {
      const blue = makeCards(20, { color: 'Blue' });
      const red = makeCards(20, { color: 'Red' }).map((c, i) => ({ ...c, id: `RED-${i}` }));
      const green = makeCards(10, { color: 'Green' }).map((c, i) => ({ ...c, id: `GRN-${i}` }));
      const allCards = [...blue, ...red, ...green];
      const deck = makeDeck(allCards.map((c) => c.id));
      const result = validateDeck(deck, allCards);

      expect(result.isValid).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('at most 2 colors')])
      );
    });

    it('ignores Colorless when counting colors', () => {
      const blue = makeCards(25, { color: 'Blue' });
      const red = makeCards(20, { color: 'Red' }).map((c, i) => ({ ...c, id: `RED-${i}` }));
      const colorless = makeCards(5, { color: 'Colorless' }).map((c, i) => ({ ...c, id: `CL-${i}` }));
      const allCards = [...blue, ...red, ...colorless];
      const deck = makeDeck(allCards.map((c) => c.id));
      const result = validateDeck(deck, allCards);

      const colorErrors = result.errors.filter((e) => e.includes('colors'));
      expect(colorErrors).toHaveLength(0);
    });
  });

  describe('max copies per card (Rule 2-1-2)', () => {
    it('allows up to 4 copies by default', () => {
      const cards = makeCards(50);
      // Use 4 copies of first card, 1 each of others
      const deck = [
        { cardId: cards[0].id, qty: 4 },
        ...cards.slice(1, 47).map((c) => ({ cardId: c.id, qty: 1 })),
      ];
      const result = validateDeck(deck, cards);

      const copyErrors = result.errors.filter((e) => e.includes('max copies'));
      expect(copyErrors).toHaveLength(0);
    });

    it('errors when exceeding 4 copies', () => {
      const cards = makeCards(50);
      const deck = [
        { cardId: cards[0].id, qty: 5 },
        ...cards.slice(1, 46).map((c) => ({ cardId: c.id, qty: 1 })),
      ];
      const result = validateDeck(deck, cards);

      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('exceeds max copies')])
      );
    });

    it('respects configurable maxCopiesPerCard', () => {
      const cards = makeCards(50);
      const deck = [
        { cardId: cards[0].id, qty: 3 },
        ...cards.slice(1, 48).map((c) => ({ cardId: c.id, qty: 1 })),
      ];
      const result = validateDeck(deck, cards, { maxCopiesPerCard: 2 });

      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('exceeds max copies')])
      );
    });
  });

  describe('unknown card IDs', () => {
    it('flags unknown card IDs as errors', () => {
      const cards = makeCards(49);
      const deck = [
        ...makeDeck(cards.map((c) => c.id)),
        { cardId: 'UNKNOWN-999', qty: 1 },
      ];
      const result = validateDeck(deck, cards);

      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('Unknown card IDs')])
      );
      expect(result.metrics.unknownCardIds).toContain('UNKNOWN-999');
    });
  });

  describe('resource deck (Rule 6-1-1)', () => {
    it('errors when resource deck is not exactly 10', () => {
      const mainCards = makeCards(50);
      const resourceCards = makeCards(5, { type: 'Resource' }).map((c, i) => ({
        ...c,
        id: `RES-${i}`,
      }));
      const allCards = [...mainCards, ...resourceCards];
      const deck = [
        ...makeDeck(mainCards.map((c) => c.id)),
        ...makeDeck(resourceCards.map((c) => c.id)),
      ];
      const result = validateDeck(deck, allCards);

      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('Resource deck must contain exactly 10')])
      );
    });

    it('errors when resource deck is missing entirely', () => {
      const cards = makeCards(50);
      const deck = makeDeck(cards.map((c) => c.id));
      const result = validateDeck(deck, cards);

      expect(result.errors).toEqual(
        expect.arrayContaining([expect.stringContaining('Resource deck must contain exactly 10')])
      );
    });

    it('passes when resource deck has exactly 10 cards', () => {
      const mainCards = makeCards(50);
      const resourceCards = makeCards(10, { type: 'Resource' }).map((c, i) => ({
        ...c,
        id: `RES-${i}`,
      }));
      const allCards = [...mainCards, ...resourceCards];
      const deck = [
        ...makeDeck(mainCards.map((c) => c.id)),
        ...makeDeck(resourceCards.map((c) => c.id)),
      ];
      const result = validateDeck(deck, allCards);

      const resourceErrors = result.errors.filter((e) => e.includes('Resource deck'));
      expect(resourceErrors).toHaveLength(0);
    });
  });

  describe('warnings', () => {
    it('warns when fewer than 15 Units', () => {
      const cards = makeCards(50, { type: 'Command' });
      const deck = makeDeck(cards.map((c) => c.id));
      const result = validateDeck(deck, cards);

      expect(result.warnings).toEqual(
        expect.arrayContaining([expect.stringContaining('Unit cards')])
      );
    });

    it('warns when average cost is high', () => {
      const cards = makeCards(50, { cost: 6 });
      const deck = makeDeck(cards.map((c) => c.id));
      const result = validateDeck(deck, cards);

      expect(result.warnings).toEqual(
        expect.arrayContaining([expect.stringContaining('Average card cost is high')])
      );
    });
  });

  describe('metrics', () => {
    it('computes correct cost curve', () => {
      const cards = [
        ...makeCards(3, { cost: 1 }),
        ...makeCards(5, { cost: 2 }).map((c, i) => ({ ...c, id: `C2-${i}` })),
        ...makeCards(42, { cost: 3 }).map((c, i) => ({ ...c, id: `C3-${i}` })),
      ];
      const deck = makeDeck(cards.map((c) => c.id));
      const result = validateDeck(deck, cards);

      expect(result.metrics.costCurve[1]).toBe(3);
      expect(result.metrics.costCurve[2]).toBe(5);
      expect(result.metrics.costCurve[3]).toBe(42);
    });

    it('computes correct type counts', () => {
      const units = makeCards(20);
      const pilots = makeCards(15, { type: 'Pilot' }).map((c, i) => ({ ...c, id: `P-${i}` }));
      const commands = makeCards(15, { type: 'Command' }).map((c, i) => ({ ...c, id: `CMD-${i}` }));
      const allCards = [...units, ...pilots, ...commands];
      const deck = makeDeck(allCards.map((c) => c.id));
      const result = validateDeck(deck, allCards);

      expect(result.metrics.typeCounts.Unit).toBe(20);
      expect(result.metrics.typeCounts.Pilot).toBe(15);
      expect(result.metrics.typeCounts.Command).toBe(15);
    });

    it('computes correct color counts', () => {
      const blue = makeCards(30, { color: 'Blue' });
      const red = makeCards(20, { color: 'Red' }).map((c, i) => ({ ...c, id: `R-${i}` }));
      const allCards = [...blue, ...red];
      const deck = makeDeck(allCards.map((c) => c.id));
      const result = validateDeck(deck, allCards);

      expect(result.metrics.colorCounts.Blue).toBe(30);
      expect(result.metrics.colorCounts.Red).toBe(20);
    });
  });

  describe('edge cases', () => {
    it('handles empty deck', () => {
      const result = validateDeck([], []);
      expect(result.isValid).toBe(false);
      expect(result.metrics.totalCards).toBe(0);
    });

    it('normalizes negative quantities to 0', () => {
      const cards = makeCards(1);
      const deck = [{ cardId: cards[0].id, qty: -5 }];
      const result = validateDeck(deck, cards);

      expect(result.metrics.totalCards).toBe(0);
    });

    it('normalizes float quantities by flooring', () => {
      const cards = makeCards(1);
      const deck = [{ cardId: cards[0].id, qty: 3.7 }];
      const result = validateDeck(deck, cards);

      expect(result.metrics.totalCards).toBe(3);
    });

    it('trims whitespace from card IDs', () => {
      const cards = makeCards(1);
      const deck = [{ cardId: '  ', qty: 1 }];
      const result = validateDeck(deck, cards);

      expect(result.metrics.totalCards).toBe(0);
    });

    it('valid 50-card main deck + 10-card resource deck passes', () => {
      const mainCards = makeCards(50, { color: 'Blue', type: 'Unit', cost: 2 });
      const resourceCards = makeCards(10, { type: 'Resource' }).map((c, i) => ({
        ...c,
        id: `RES-${i}`,
      }));
      const allCards = [...mainCards, ...resourceCards];
      const deck = [
        ...makeDeck(mainCards.map((c) => c.id)),
        ...makeDeck(resourceCards.map((c) => c.id)),
      ];
      const result = validateDeck(deck, allCards);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});
