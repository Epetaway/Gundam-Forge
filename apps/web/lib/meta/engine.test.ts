import { describe, expect, it } from 'vitest';
import { getDecks } from '../data/decks';
import { getEvents } from '../data/events';
import { rankArchetypes, rankTrendingDecks } from './engine';

describe('meta engine', () => {
  it('ranks decks by descending trending score', () => {
    const decks = getDecks();
    const events = getEvents();
    const ranked = rankTrendingDecks(decks, events, 4);

    expect(ranked).toHaveLength(4);
    expect(ranked[0].trendingScore).toBeGreaterThanOrEqual(ranked[1].trendingScore);
  });

  it('produces archetype stats with valid win-rate range', () => {
    const archetypes = rankArchetypes(getEvents());
    expect(archetypes.length).toBeGreaterThan(0);

    for (const archetype of archetypes) {
      expect(archetype.winRate).toBeGreaterThanOrEqual(0);
      expect(archetype.winRate).toBeLessThanOrEqual(1);
    }
  });
});
