import { describe, expect, it } from 'vitest';
import {
  filtersFromSearchParams,
  filtersToSearchParams,
  getFilterMismatchKeys,
  matchesSelectedValues,
  normalizeComparableFilters,
} from '../cardFilters';

describe('cardFilters serialization', () => {
  it('round-trips complex filter payload through URL params', () => {
    const original = {
      query: 'char aznable',
      color: 'Red' as const,
      type: 'Pilot' as const,
      set: 'ST01',
      keyword: 'Rush',
      zone: 'Space',
      deckRole: 'main' as const,
      clans: ['Zeon', 'Neo Zeon'],
      traits: ['Newtype', 'Ace'],
      keywords: ['repair', 'support'],
      triggers: ['deploy', 'burst'],
      matchMode: 'broad' as const,
    };

    const params = filtersToSearchParams(original);
    const parsed = filtersFromSearchParams(params);

    expect(parsed).toEqual(original);
  });

  it('omits strict mode from URL and defaults to strict semantics in matcher usage', () => {
    const params = filtersToSearchParams({ matchMode: 'strict', clans: ['Zeon'] });
    expect(params.get('matchMode')).toBeNull();
    expect(filtersFromSearchParams(params).matchMode).toBeUndefined();
  });
});

describe('matchesSelectedValues', () => {
  it('requires all values in strict mode', () => {
    expect(matchesSelectedValues(['Zeon', 'Newtype'], ['Zeon', 'Newtype'], 'strict')).toBe(true);
    expect(matchesSelectedValues(['Zeon'], ['Zeon', 'Newtype'], 'strict')).toBe(false);
  });

  it('requires any value in broad mode', () => {
    expect(matchesSelectedValues(['Zeon'], ['Zeon', 'Newtype'], 'broad')).toBe(true);
    expect(matchesSelectedValues(['Federation'], ['Zeon', 'Newtype'], 'broad')).toBe(false);
  });

  it('treats missing card values as non-match for selected filters', () => {
    expect(matchesSelectedValues(undefined, ['Zeon'], 'strict')).toBe(false);
    expect(matchesSelectedValues([], ['Zeon'], 'broad')).toBe(false);
  });
});

describe('filter mismatch detection', () => {
  it('normalizes empty and default values consistently', () => {
    const normalized = normalizeComparableFilters({
      query: '  ',
      color: 'All',
      type: 'All',
      clans: ['Zeon', 'Zeon', ''],
      matchMode: 'strict',
    });

    expect(normalized).toEqual({
      query: undefined,
      color: undefined,
      type: undefined,
      set: undefined,
      keyword: undefined,
      zone: undefined,
      deckRole: undefined,
      matchMode: undefined,
      clans: ['Zeon'],
      traits: undefined,
      keywords: undefined,
      triggers: undefined,
    });
  });

  it('returns no mismatch keys for equivalent filter payloads', () => {
    const keys = getFilterMismatchKeys(
      { color: 'Red', clans: ['Zeon', 'Neo Zeon'], matchMode: 'strict' },
      { color: 'Red', clans: ['Neo Zeon', 'Zeon'] },
    );

    expect(keys).toEqual([]);
  });

  it('returns mismatched keys when applied filters differ from selected filters', () => {
    const keys = getFilterMismatchKeys(
      { color: 'Red', deckRole: 'main', keywords: ['repair'] },
      { color: 'Blue', deckRole: 'resource', keywords: ['repair', 'support'] },
    );

    expect(keys).toEqual(['color', 'deckRole', 'keywords']);
  });
});
