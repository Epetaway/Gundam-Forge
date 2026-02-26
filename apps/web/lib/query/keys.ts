import type { CatalogFilters } from '@/lib/data/cards';

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
} as const;
