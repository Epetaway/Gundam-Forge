import { create } from 'zustand';

interface UIState {
  inspectedCardId: string | null;
  navSearchQuery: string;
  catalogCollapsed: boolean;
  detailDockCollapsed: boolean;

  openInspection: (cardId: string) => void;
  closeInspection: () => void;
  setNavSearchQuery: (q: string) => void;
  toggleCatalog: () => void;
  toggleDetailDock: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  inspectedCardId: null,
  navSearchQuery: '',
  catalogCollapsed: false,
  detailDockCollapsed: false,

  openInspection: (cardId) => set({ inspectedCardId: cardId }),
  closeInspection: () => set({ inspectedCardId: null }),
  setNavSearchQuery: (q) => set({ navSearchQuery: q }),
  toggleCatalog: () => set((s) => ({ catalogCollapsed: !s.catalogCollapsed })),
  toggleDetailDock: () => set((s) => ({ detailDockCollapsed: !s.detailDockCollapsed })),
}));
