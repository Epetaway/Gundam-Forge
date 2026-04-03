import { describe, expect, it } from 'vitest';
import { canLinkPlacementDeck, formatPlacementDeckLabel } from '@/lib/events/linking';

describe('event linking helpers', () => {
  it('formats placement label without duplication when deckName matches archetype', () => {
    expect(formatPlacementDeckLabel('Blue Midrange', 'Blue Midrange')).toBe('Blue Midrange');
  });

  it('formats placement label with separator when deckName differs from archetype', () => {
    expect(formatPlacementDeckLabel('Pilot Custom List', 'Blue Midrange')).toBe('Pilot Custom List · Blue Midrange');
  });

  it('blocks linking rogue-unclassified and unknown ids', () => {
    const knownDeckIds = new Set(['blue-midrange']);
    expect(canLinkPlacementDeck('rogue-unclassified', knownDeckIds)).toBe(false);
    expect(canLinkPlacementDeck('missing-id', knownDeckIds)).toBe(false);
    expect(canLinkPlacementDeck('blue-midrange', knownDeckIds)).toBe(true);
  });
});
