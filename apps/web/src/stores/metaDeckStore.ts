import { create } from 'zustand';
import {
  fetchPublicDecks,
  fetchTrendingDecks,
  fetchBulkLikeStatus,
  toggleDeckLike,
  type PublicDeckRecord,
} from '../services/deckService';

export type ExplorerTab = 'all' | 'official' | 'community';
export type SortOption = 'popular' | 'newest' | 'most_liked' | 'trending';

interface MetaDeckState {
  tab: ExplorerTab;
  search: string;
  archetype: string | null;
  colorFilter: string | null;
  sort: SortOption;
  decks: PublicDeckRecord[];
  likedDeckIds: Set<string>;
  loading: boolean;
  error: string | null;

  setTab: (tab: ExplorerTab) => void;
  setSearch: (q: string) => void;
  setArchetype: (a: string | null) => void;
  setColorFilter: (c: string | null) => void;
  setSort: (s: SortOption) => void;
  loadDecks: () => Promise<void>;
  toggleLike: (deckId: string) => Promise<void>;
}

const sortToOrderBy = (sort: SortOption): 'view_count' | 'updated_at' | 'like_count' => {
  switch (sort) {
    case 'popular': return 'view_count';
    case 'newest': return 'updated_at';
    case 'most_liked': return 'like_count';
    case 'trending': return 'view_count';
  }
};

const tabToSource = (tab: ExplorerTab): 'user' | 'official' | 'all' => {
  switch (tab) {
    case 'all': return 'all';
    case 'official': return 'official';
    case 'community': return 'user';
  }
};

export const useMetaDeckStore = create<MetaDeckState>((set, get) => ({
  tab: 'all',
  search: '',
  archetype: null,
  colorFilter: null,
  sort: 'popular',
  decks: [],
  likedDeckIds: new Set(),
  loading: false,
  error: null,

  setTab: (tab) => { set({ tab }); get().loadDecks(); },
  setSearch: (search) => { set({ search }); },
  setArchetype: (archetype) => { set({ archetype }); get().loadDecks(); },
  setColorFilter: (colorFilter) => { set({ colorFilter }); get().loadDecks(); },
  setSort: (sort) => { set({ sort }); get().loadDecks(); },

  loadDecks: async () => {
    const { search, archetype, sort, tab, colorFilter } = get();
    set({ loading: true, error: null });

    try {
      let decks: PublicDeckRecord[];

      if (sort === 'trending') {
        decks = await fetchTrendingDecks(50);
      } else {
        decks = await fetchPublicDecks({
          limit: 50,
          search: search || undefined,
          orderBy: sortToOrderBy(sort),
          archetype: archetype || undefined,
          source: tabToSource(tab),
          color: colorFilter || undefined,
        });
      }

      set({ decks, loading: false });

      // Fetch like status in background
      if (decks.length > 0) {
        const likedDeckIds = await fetchBulkLikeStatus(decks.map((d) => d.id));
        set({ likedDeckIds });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to load decks',
        loading: false,
      });
    }
  },

  toggleLike: async (deckId) => {
    const { likedDeckIds, decks } = get();
    const wasLiked = likedDeckIds.has(deckId);

    // Optimistic update
    const newLiked = new Set(likedDeckIds);
    if (wasLiked) {
      newLiked.delete(deckId);
    } else {
      newLiked.add(deckId);
    }
    set({
      likedDeckIds: newLiked,
      decks: decks.map((d) =>
        d.id === deckId
          ? { ...d, like_count: d.like_count + (wasLiked ? -1 : 1) }
          : d
      ),
    });

    try {
      const result = await toggleDeckLike(deckId);
      // Reconcile with server state
      const reconciled = new Set(get().likedDeckIds);
      if (result.liked) {
        reconciled.add(deckId);
      } else {
        reconciled.delete(deckId);
      }
      set({
        likedDeckIds: reconciled,
        decks: get().decks.map((d) =>
          d.id === deckId ? { ...d, like_count: result.like_count } : d
        ),
      });
    } catch {
      // Revert optimistic update
      set({
        likedDeckIds: likedDeckIds,
        decks: decks,
      });
    }
  },
}));
