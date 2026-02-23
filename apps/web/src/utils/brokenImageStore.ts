import { create } from 'zustand';

interface BrokenImageState {
  /** Card IDs whose images failed to load */
  brokenIds: Record<string, true>;
  /** Mark a card's image as broken so it can be hidden from grids */
  markBroken: (cardId: string) => void;
  /** Check whether a card's image is broken */
  isBroken: (cardId: string) => boolean;
}

export const useBrokenImageStore = create<BrokenImageState>((set, get) => ({
  brokenIds: {},
  markBroken: (cardId) =>
    set((state) => {
      if (state.brokenIds[cardId]) return state; // already tracked
      return { brokenIds: { ...state.brokenIds, [cardId]: true } };
    }),
  isBroken: (cardId) => !!get().brokenIds[cardId],
}));
