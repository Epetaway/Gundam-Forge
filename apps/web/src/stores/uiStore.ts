import { create } from 'zustand';

type Theme = 'light' | 'dark';

const getInitialTheme = (): Theme => {
  try {
    const stored = localStorage.getItem('gundam-forge:theme');
    if (stored === 'dark' || stored === 'light') return stored;
  } catch { /* noop */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

interface UIState {
  inspectedCardId: string | null;
  navSearchQuery: string;
  catalogCollapsed: boolean;
  detailDockCollapsed: boolean;
  theme: Theme;

  openInspection: (cardId: string) => void;
  closeInspection: () => void;
  setNavSearchQuery: (q: string) => void;
  toggleCatalog: () => void;
  toggleDetailDock: () => void;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  try { localStorage.setItem('gundam-forge:theme', theme); } catch { /* noop */ }
};

export const useUIStore = create<UIState>((set) => {
  const initialTheme = getInitialTheme();
  applyTheme(initialTheme);

  return {
    inspectedCardId: null,
    navSearchQuery: '',
    catalogCollapsed: false,
    detailDockCollapsed: false,
    theme: initialTheme,

    openInspection: (cardId) => set({ inspectedCardId: cardId }),
    closeInspection: () => set({ inspectedCardId: null }),
    setNavSearchQuery: (q) => set({ navSearchQuery: q }),
    toggleCatalog: () => set((s) => ({ catalogCollapsed: !s.catalogCollapsed })),
    toggleDetailDock: () => set((s) => ({ detailDockCollapsed: !s.detailDockCollapsed })),
    toggleTheme: () =>
      set((s) => {
        const next: Theme = s.theme === 'light' ? 'dark' : 'light';
        applyTheme(next);
        return { theme: next };
      }),
    setTheme: (theme) => {
      applyTheme(theme);
      set({ theme });
    },
  };
});
