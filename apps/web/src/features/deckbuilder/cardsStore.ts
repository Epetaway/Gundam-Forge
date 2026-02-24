import { create } from 'zustand';
import type { CardDefinition, CardType, CardColor } from '@gundam-forge/shared';

export interface CatalogFilters {
  color: CardColor | 'All';
  cost: number | 'All';
  type: CardType | 'All';
  set: string | 'All';
}

interface CardsState {
  cards: CardDefinition[];
  cardsById: Map<string, CardDefinition>;
  query: string;
  selectedCardId: string | null;
  filters: CatalogFilters;
  hydrateCards: (cards: CardDefinition[]) => void;
  setQuery: (query: string) => void;
  setSelectedCardId: (id: string | null) => void;
  setFilter: <K extends keyof CatalogFilters>(key: K, value: CatalogFilters[K]) => void;
  clearFilters: () => void;
}

const defaultFilters: CatalogFilters = {
  color: 'All',
  cost: 'All',
  type: 'All',
  set: 'All'
};

export const useCardsStore = create<CardsState>((set) => ({
  cards: [],
  cardsById: new Map(),
  query: '',
  selectedCardId: null,
  filters: defaultFilters,
  hydrateCards: (cards) =>
    set(() => ({
      cards,
      cardsById: new Map(cards.map((c) => [c.id, c])),
      selectedCardId: cards.length > 0 ? cards[0].id : null
    })),
  setQuery: (query) => set(() => ({ query })),
  setSelectedCardId: (id) => set(() => ({ selectedCardId: id })),
  setFilter: (key, value) =>
    set((state) => ({
      filters: {
        ...state.filters,
        [key]: value
      }
    })),
  clearFilters: () => set(() => ({ filters: defaultFilters, query: '' }))
}));

/** O(1) card lookup — use outside React components */
export const getCardById = (id: string): CardDefinition | undefined =>
  useCardsStore.getState().cardsById.get(id);

export const filterCatalogCards = (cards: CardDefinition[], query: string, filters: CatalogFilters) => {
  const normalizedQuery = query.trim().toLowerCase();

  return cards.filter((card) => {
    if (normalizedQuery.length > 0) {
      const haystack = `${card.name} ${card.id}`.toLowerCase();
      if (!haystack.includes(normalizedQuery)) return false;
    }

    if (filters.color !== 'All' && card.color !== filters.color) return false;
    if (filters.cost !== 'All' && card.cost !== filters.cost) return false;
    if (filters.type !== 'All' && card.type !== filters.type) return false;
    if (filters.set !== 'All' && card.set !== filters.set) return false;

    return true;
  });
};
