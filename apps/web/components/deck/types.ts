import type { DeckDensity, DeckViewItem } from '@/lib/deck/sortFilter';

export interface DeckViewSelection {
  activeCardId: string | null;
}

export interface DeckViewActions {
  onOpenCard: (cardId: string) => void;
}

export interface DeckViewUiState {
  density: DeckDensity;
  features: {
    collection: boolean;
    deckEdit: boolean;
  };
}

export interface DeckViewRendererProps {
  items: DeckViewItem[];
  selection: DeckViewSelection;
  actions: DeckViewActions;
  ui: DeckViewUiState;
}
