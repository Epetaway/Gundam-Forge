import { create } from 'zustand';

export const DECK_STORAGE_KEY = 'gundam-forge:deck:v1';

export interface DeckEntry {
  cardId: string;
  qty: number;
}

interface DeckState {
  entries: DeckEntry[];
  hydratedFromStorage: boolean;
  addCard: (cardId: string) => void;
  removeCard: (cardId: string) => void;
  setDeck: (entries: DeckEntry[]) => void;
  clearDeck: () => void;
  loadFromStorage: () => void;
}

export const normalizeDeckEntries = (entries: DeckEntry[]) => {
  const counter = new Map<string, number>();

  for (const entry of entries) {
    const cardId = entry.cardId?.trim();
    if (!cardId) continue;
    if (!Number.isFinite(entry.qty)) continue;
    const qty = Math.floor(entry.qty);
    if (qty <= 0) continue;
    counter.set(cardId, (counter.get(cardId) ?? 0) + qty);
  }

  return [...counter.entries()]
    .map(([cardId, qty]) => ({ cardId, qty }))
    .sort((a, b) => a.cardId.localeCompare(b.cardId));
};

export const serializeDeck = (entries: DeckEntry[]) => JSON.stringify(normalizeDeckEntries(entries));

export const parseDeck = (raw: string) => {
  try {
    const parsed = JSON.parse(raw) as DeckEntry[];
    if (!Array.isArray(parsed)) return [];
    return normalizeDeckEntries(parsed);
  } catch {
    return [];
  }
};

export const useDeckStore = create<DeckState>((set, get) => ({
  entries: [],
  hydratedFromStorage: false,

  addCard: (cardId) =>
    set((state) => {
      const existing = state.entries.find((entry) => entry.cardId === cardId);
      if (existing) {
        return {
          entries: state.entries.map((entry) =>
            entry.cardId === cardId ? { ...entry, qty: entry.qty + 1 } : entry
          )
        };
      }

      return { entries: [...state.entries, { cardId, qty: 1 }] };
    }),

  removeCard: (cardId) =>
    set((state) => {
      const existing = state.entries.find((entry) => entry.cardId === cardId);
      if (!existing) return state;
      if (existing.qty <= 1) {
        return { entries: state.entries.filter((entry) => entry.cardId !== cardId) };
      }

      return {
        entries: state.entries.map((entry) =>
          entry.cardId === cardId ? { ...entry, qty: entry.qty - 1 } : entry
        )
      };
    }),

  setDeck: (entries) => set(() => ({ entries: normalizeDeckEntries(entries) })),
  clearDeck: () => set(() => ({ entries: [] })),

  loadFromStorage: () => {
    if (get().hydratedFromStorage) return;

    let loadedEntries: DeckEntry[] = [];
    try {
      const stored = localStorage.getItem(DECK_STORAGE_KEY);
      if (stored) loadedEntries = parseDeck(stored);
    } catch {
      loadedEntries = [];
    }

    set(() => ({ entries: loadedEntries, hydratedFromStorage: true }));
  }
}));
