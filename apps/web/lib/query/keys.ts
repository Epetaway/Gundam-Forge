import type { CatalogFilters } from '@/lib/data/cards';
import type { CardSearchParams } from '@/lib/api/cardSearch';

export interface DeckQueryFilters {
  query?: string;
  color?: string;
  archetype?: string;
}

export const queryKeys = {
  cards: {
    all: ['cards'] as const,
    list: (filters: CatalogFilters) => ['cards', 'list', filters] as const,
    // Paginated search results — keyed by full param set so cursor changes bust cache
    search: (params: CardSearchParams) => ['cards', 'search', params] as const,
    // Full card detail — fetched on-demand when a user selects a card
    detail: (id: string) => ['cards', 'detail', id] as const,
  },
  decks: {
    all: ['decks'] as const,
    list: (filters: DeckQueryFilters) => ['decks', 'list', filters] as const,
  },
} as const;
