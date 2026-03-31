import type { CatalogFilters } from '@/lib/filters/cardFilters';

export interface DeckQueryFilters {
  query?: string;
  color?: string;
  archetype?: string;
}

export const queryKeys = {
  cards: {
    all: ['cards'] as const,
    list: (filters: CatalogFilters) => ['cards', 'list', filters] as const,
  },
  decks: {
    all: ['decks'] as const,
    list: (filters: DeckQueryFilters) => ['decks', 'list', filters] as const,
  },
  deckAnalytics: {
    all: ['deck-analytics'] as const,
    detail: (deckId: string) => ['deck-analytics', 'detail', deckId] as const,
    cards: (deckId: string) => ['deck-analytics', 'cards', deckId] as const,
    comparison: (deckId: string) => ['deck-analytics', 'comparison', deckId] as const,
  },
} as const;
