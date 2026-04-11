import { describe, expect, it } from 'vitest';
import type { DeckRecord } from '@/lib/data/decks';
import { availableDeckArchetypes, availableDeckColors, filterAndSortDeckBrowserData } from '@/lib/decks/browser';
import type { TrendingDeckRecord } from '@/lib/meta/engine';

function makeDeck(overrides: Partial<TrendingDeckRecord>): TrendingDeckRecord {
  const base: DeckRecord = {
    id: 'deck-a',
    name: 'Deck A',
    description: '',
    archetype: 'Midrange',
    owner: 'Tester',
    colors: ['Blue'],
    likes: 0,
    views: 0,
    entries: [],
    updatedAt: '2026-01-01T00:00:00Z',
    source: 'catalog',
  };

  return {
    ...base,
    trendingScore: 0,
    winRate: 0,
    eventAppearances: 0,
    ...overrides,
  };
}

describe('deck browser helpers', () => {
  const ranked: TrendingDeckRecord[] = [
    makeDeck({ id: 'd1', archetype: 'Aggro', colors: ['Red'], views: 120, winRate: 0.52, trendingScore: 30, updatedAt: '2026-04-01T00:00:00Z' }),
    makeDeck({ id: 'd2', archetype: 'Control', colors: ['Blue', 'White'], views: 40, winRate: 0.63, trendingScore: 50, updatedAt: '2026-04-03T00:00:00Z' }),
    makeDeck({ id: 'd3', archetype: 'Ramp', colors: ['Green'], views: 200, winRate: 0.45, trendingScore: 20, updatedAt: '2026-03-30T00:00:00Z' }),
  ];

  it('filters by selected colors and archetype', () => {
    const filtered = filterAndSortDeckBrowserData(ranked, {
      selectedColors: ['Blue'],
      archetype: 'Control',
      sort: 'newest',
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('d2');
  });

  it('sorts by win rate when requested', () => {
    const sorted = filterAndSortDeckBrowserData(ranked, {
      selectedColors: [],
      archetype: 'All',
      sort: 'winRate',
    });

    expect(sorted.map((d) => d.id)).toEqual(['d2', 'd1', 'd3']);
  });

  it('filters by source scope when requested', () => {
    const withSources: TrendingDeckRecord[] = [
      makeDeck({ id: 'tourney', source: 'tournament', archetype: 'Aggro' }),
      makeDeck({ id: 'catalog-1', source: 'catalog', archetype: 'Control' }),
      makeDeck({ id: 'catalog-2', source: 'catalog', archetype: 'Ramp' }),
    ];

    const tournamentOnly = filterAndSortDeckBrowserData(withSources, {
      selectedColors: [],
      archetype: 'All',
      sort: 'newest',
      sourceScope: 'tournament',
    });
    expect(tournamentOnly.map((deck) => deck.id)).toEqual(['tourney']);

    const communityOnly = filterAndSortDeckBrowserData(withSources, {
      selectedColors: [],
      archetype: 'All',
      sort: 'newest',
      sourceScope: 'community',
    });
    expect(communityOnly.map((deck) => deck.id).sort()).toEqual(['catalog-1', 'catalog-2']);
  });

  it('returns ordered available colors', () => {
    expect(availableDeckColors(ranked)).toEqual(['Blue', 'Green', 'Red', 'White']);
  });

  it('returns sorted archetype options prefixed by All', () => {
    expect(availableDeckArchetypes(ranked)).toEqual(['All', 'Aggro', 'Control', 'Ramp']);
  });
});
