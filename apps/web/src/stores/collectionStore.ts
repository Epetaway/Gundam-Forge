import { create } from 'zustand';
import {
  fetchCollection,
  addToCollection,
  removeFromCollection,
} from '../services/collectionService';

interface CollectionState {
  /** Set of card IDs the user owns */
  ownedCardIds: Set<string>;
  /** Map of card ID -> owned quantity */
  ownedQty: Map<string, number>;
  /** Whether collection has been loaded from Supabase */
  loaded: boolean;
  loading: boolean;

  /** Load collection from Supabase */
  loadCollection: () => Promise<void>;
  /** Add a card to the user's collection (optimistic + persist) */
  addToCollection: (cardId: string) => void;
  /** Remove a card from the user's collection (optimistic + persist) */
  removeFromCollection: (cardId: string) => void;
  /** Clear local state (on sign-out) */
  clearCollection: () => void;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  ownedCardIds: new Set(),
  ownedQty: new Map(),
  loaded: false,
  loading: false,

  loadCollection: async () => {
    if (get().loading) return;
    set({ loading: true });
    try {
      const records = await fetchCollection();
      const ids = new Set<string>();
      const qty = new Map<string, number>();
      for (const r of records) {
        ids.add(r.card_id);
        qty.set(r.card_id, r.qty);
      }
      set({ ownedCardIds: ids, ownedQty: qty, loaded: true, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  addToCollection: (cardId) => {
    const { ownedCardIds, ownedQty } = get();
    const newIds = new Set(ownedCardIds);
    const newQty = new Map(ownedQty);
    newIds.add(cardId);
    newQty.set(cardId, (newQty.get(cardId) ?? 0) + 1);
    set({ ownedCardIds: newIds, ownedQty: newQty });

    // Persist in background
    addToCollection(cardId).catch(() => {
      // Revert on failure
      get().loadCollection();
    });
  },

  removeFromCollection: (cardId) => {
    const { ownedCardIds, ownedQty } = get();
    const currentQty = ownedQty.get(cardId) ?? 0;
    if (currentQty <= 0) return;

    const newIds = new Set(ownedCardIds);
    const newQty = new Map(ownedQty);

    if (currentQty <= 1) {
      newIds.delete(cardId);
      newQty.delete(cardId);
    } else {
      newQty.set(cardId, currentQty - 1);
    }
    set({ ownedCardIds: newIds, ownedQty: newQty });

    // Persist in background
    removeFromCollection(cardId).catch(() => {
      get().loadCollection();
    });
  },

  clearCollection: () => {
    set({ ownedCardIds: new Set(), ownedQty: new Map(), loaded: false });
  },
}));
