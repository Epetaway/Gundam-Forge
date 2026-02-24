import { create } from 'zustand';

export const DECK_STORAGE_KEY = 'gundam-forge:deck:v1';

export interface DeckEntry {
  cardId: string;
  qty: number;
  isBoss?: boolean;
}

interface DeckState {
  entries: DeckEntry[];
  hydratedFromStorage: boolean;
  addCard: (cardId: string) => void;
  removeCard: (cardId: string) => void;
  toggleBoss: (cardId: string) => void;
  moveEntry: (fromIndex: number, toIndex: number) => void;
  setDeck: (entries: DeckEntry[]) => void;
  clearDeck: () => void;
  loadFromStorage: () => void;
}

export const normalizeDeckEntries = (entries: DeckEntry[]) => {
  const counter = new Map<string, { qty: number; isBoss: boolean }>();

  for (const entry of entries) {
    const cardId = entry.cardId?.trim();
    if (!cardId) continue;
    if (!Number.isFinite(entry.qty)) continue;
    const qty = Math.floor(entry.qty);
    if (qty <= 0) continue;
    const existing = counter.get(cardId);
    counter.set(cardId, {
      qty: (existing?.qty ?? 0) + qty,
      isBoss: entry.isBoss ?? existing?.isBoss ?? false,
    });
  }

  return [...counter.entries()]
    .map(([cardId, v]) => ({ cardId, qty: v.qty, isBoss: v.isBoss }))
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

      return { entries: [...state.entries, { cardId, qty: 1, isBoss: false }] };
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

  toggleBoss: (cardId) =>
    set((state) => {
      const bossCount = state.entries.filter((e) => e.isBoss).length;
      return {
        entries: state.entries.map((entry) => {
          if (entry.cardId !== cardId) return entry;
          const newIsBoss = !entry.isBoss;
          if (newIsBoss && bossCount >= 4) return entry;
          return { ...entry, isBoss: newIsBoss };
        }),
      };
    }),

  setDeck: (entries) => set(() => ({ entries: normalizeDeckEntries(entries) })),
  clearDeck: () => set(() => ({ entries: [] })),

  moveEntry: (fromIndex, toIndex) =>
    set((state) => {
      if (fromIndex === toIndex) return state;
      const next = [...state.entries];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return { entries: next };
    }),

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
