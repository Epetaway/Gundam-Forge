import type { DeckDensity, DeckViewItem } from '@/lib/deck/sortFilter';

export interface DeckViewSelection {
  activeCardId: string | null;
}

export interface DeckViewActions {
  onOpenCard: (cardId: string) => void;
  /** Builder mode only: add one copy to the deck. */
  onAdd?: (cardId: string) => void;
  /** Builder mode only: remove one copy from the deck. */
  onRemove?: (cardId: string) => void;
}

export interface DeckViewUiState {
  density: DeckDensity;
  /** viewer → no edit controls visible; builder → hover overlay with +/–/› */
  mode: 'viewer' | 'builder';
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
