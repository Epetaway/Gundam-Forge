import { describe, expect, it } from 'vitest';
import { cards, getCardList, getCards } from '../cards';

describe('card filtering parity', () => {
  it('returns the same IDs for getCards and getCardList (no pagination cap)', () => {
    const seed = cards[0];
    const filters = {
      color: seed.color,
      type: seed.type,
    } as const;

    const full = getCards(filters)
      .map((card) => card.id)
      .sort((a, b) => a.localeCompare(b));

    const paged = getCardList({ ...filters, limit: 9999 }).results
      .map((card) => card.id)
      .sort((a, b) => a.localeCompare(b));

    expect(paged).toEqual(full);
  });

  it('reports accurate total count in paged response metadata', () => {
    const list = getCardList({ limit: 15, keyword: 'Burst' });
    const full = getCards({ keyword: 'Burst' });

    expect(list.total).toBe(full.length);
    expect(list.results.length).toBeLessThanOrEqual(15);
  });

  it('applies strict and broad semantics differently for multi-select trait filters', () => {
    const cardWithTrait = cards.find((card) => (card.traits ?? []).length > 0);
    expect(cardWithTrait).toBeDefined();

    const trait = cardWithTrait!.traits![0];
    const missing = '__does_not_exist__';

    const strict = getCards({ traits: [trait, missing], matchMode: 'strict' });
    const broad = getCards({ traits: [trait, missing], matchMode: 'broad' });

    expect(strict.some((card) => card.id === cardWithTrait!.id)).toBe(false);
    expect(broad.some((card) => card.id === cardWithTrait!.id)).toBe(true);
  });
});
