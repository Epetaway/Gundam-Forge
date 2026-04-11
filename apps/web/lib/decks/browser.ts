import type { DeckRecord } from '@/lib/data/decks';
import { rankTrendingDecks, type TrendingDeckRecord } from '@/lib/meta/engine';
import type { EventRecord } from '@/lib/data/events';

export type DeckSort = 'newest' | 'trending' | 'winRate' | 'mostViewed';
export type DeckSourceScope = 'all' | 'tournament' | 'community';

function updatedTimestamp(deck: DeckRecord): number {
  const timestamp = Date.parse(deck.updatedAt ?? '');
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function rankDeckBrowserData(decks: DeckRecord[], events: EventRecord[]): TrendingDeckRecord[] {
  return rankTrendingDecks(decks, events, Math.max(decks.length, 1));
}

export function filterAndSortDeckBrowserData(
  decks: TrendingDeckRecord[],
  options: { selectedColors: string[]; archetype: string; sort: DeckSort; sourceScope?: DeckSourceScope },
): TrendingDeckRecord[] {
  const sourceScoped =
    !options.sourceScope || options.sourceScope === 'all'
      ? decks
      : options.sourceScope === 'tournament'
        ? decks.filter((deck) => deck.source === 'tournament')
        : decks.filter((deck) => deck.source !== 'tournament');

  const filtered = sourceScoped.filter((deck) => {
    const matchesColors = options.selectedColors.length === 0 || (deck.colors ?? []).some((c) => options.selectedColors.includes(c));
    const matchesArchetype = options.archetype === 'All' || deck.archetype === options.archetype;
    return matchesColors && matchesArchetype;
  });

  if (options.sort === 'trending') return filtered;
  if (options.sort === 'winRate') return [...filtered].sort((a, b) => b.winRate - a.winRate);
  if (options.sort === 'mostViewed') return [...filtered].sort((a, b) => b.views - a.views);
  return [...filtered].sort((a, b) => updatedTimestamp(b) - updatedTimestamp(a));
}

export function availableDeckColors(decks: TrendingDeckRecord[]): string[] {
  const values = new Set<string>();
  for (const deck of decks) {
    for (const color of deck.colors ?? []) values.add(color);
  }
  const order = ['Blue', 'Green', 'Red', 'White', 'Purple', 'Colorless'];
  return order.filter((color) => values.has(color));
}

export function availableDeckArchetypes(decks: TrendingDeckRecord[]): string[] {
  const values = new Set<string>();
  for (const deck of decks) {
    if (deck.archetype?.trim()) values.add(deck.archetype);
  }
  return ['All', ...Array.from(values).sort((a, b) => a.localeCompare(b))];
}
