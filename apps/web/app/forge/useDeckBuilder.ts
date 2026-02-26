'use client';

import * as React from 'react';

// Minimal card shape needed for deck ops — populated from search results
export interface CardSummaryForDeck {
  id: string;
  name: string;
  type: string; // 'Unit'|'Pilot'|'Command'|'Base'|'Resource'
  color: string;
  cost: number;
  set: string;
  imageUrl?: string;
}

export type DeckRecord = Record<string, number>; // cardId → qty

export interface DeckValidation {
  errors: string[];
  warnings: string[];
  totalMain: number;
  totalResource: number;
}

export interface DeckBuilderState {
  deck: DeckRecord;
  deckName: string;
  cardCache: Map<string, CardSummaryForDeck>;
  addCard: (card: CardSummaryForDeck) => void;
  removeCard: (cardId: string) => void;
  setQty: (cardId: string, qty: number) => void;
  setDeckName: (name: string) => void;
  totalCards: number;
  validation: DeckValidation | null;
}

const MAX_COPIES = 4;

function runValidation(
  deck: DeckRecord,
  cardCache: Map<string, CardSummaryForDeck>,
): DeckValidation | null {
  const entries = Object.entries(deck);
  if (entries.length === 0) return null;

  const errors: string[] = [];
  const warnings: string[] = [];
  let totalMain = 0;
  let totalResource = 0;
  const colors = new Set<string>();
  const copies: Record<string, number> = {};

  for (const [cardId, qty] of entries) {
    copies[cardId] = (copies[cardId] ?? 0) + qty;
    const card = cardCache.get(cardId);
    if (card?.type === 'Resource') {
      totalResource += qty;
    } else {
      totalMain += qty;
      if (card && card.color !== 'Colorless') colors.add(card.color);
    }
  }

  // Rule: Main deck exactly 50 (Rule 6-1-1)
  if (totalMain !== 50) {
    const delta = 50 - totalMain;
    errors.push(
      delta > 0
        ? `Main deck needs ${delta} more card${delta !== 1 ? 's' : ''} (${totalMain}/50).`
        : `Main deck has ${-delta} too many card${-delta !== 1 ? 's' : ''} (${totalMain}/50).`,
    );
  }

  // Rule: Resource deck exactly 10 if non-zero (Rule 6-1-1)
  if (totalResource > 0 && totalResource !== 10) {
    errors.push(`Resource deck must contain exactly 10 cards (${totalResource}/10).`);
  }

  // Rule: Max 2 non-Colorless colors (Rule 6-1-1-2)
  const nonColorless = [...colors].filter((c) => c !== 'Colorless');
  if (nonColorless.length > 2) {
    errors.push(`Too many colors: ${nonColorless.join(', ')} — max 2 excluding Colorless.`);
  }

  // Rule: Max 4 copies per card (Rule 2-1-2)
  for (const [cardId, qty] of Object.entries(copies)) {
    if (qty > MAX_COPIES) {
      const name = cardCache.get(cardId)?.name ?? cardId;
      errors.push(`${name}: too many copies (${qty}/${MAX_COPIES}).`);
    }
  }

  // Warnings
  if (totalMain > 0 && totalMain < 50) {
    const unitCount = entries.reduce((sum, [cardId, qty]) => {
      const card = cardCache.get(cardId);
      return sum + (card?.type === 'Unit' ? qty : 0);
    }, 0);
    if (unitCount < 15) {
      warnings.push(
        `Consider more Unit cards (${unitCount} in deck; recommend ≥15).`,
      );
    }
  }

  return { errors, warnings, totalMain, totalResource };
}

export function useDeckBuilder(): DeckBuilderState {
  const [deck, setDeck] = React.useState<DeckRecord>({});
  const [deckName, setDeckName] = React.useState('Untitled Deck');
  const [cardCache, setCardCache] = React.useState<Map<string, CardSummaryForDeck>>(new Map());

  const addCard = React.useCallback((card: CardSummaryForDeck) => {
    const { id: cardId } = card;
    // Register card metadata in cache if not already present
    setCardCache((prev) => {
      if (prev.has(cardId)) return prev;
      const next = new Map(prev);
      next.set(cardId, card);
      return next;
    });
    setDeck((prev) => {
      const current = prev[cardId] ?? 0;
      if (current >= MAX_COPIES) return prev;
      return { ...prev, [cardId]: current + 1 };
    });
  }, []);

  const removeCard = React.useCallback((cardId: string) => {
    setDeck((prev) => {
      const current = prev[cardId] ?? 0;
      if (current <= 0) return prev;
      const next = { ...prev, [cardId]: current - 1 };
      if (next[cardId] === 0) delete next[cardId];
      return next;
    });
  }, []);

  const setQty = React.useCallback((cardId: string, qty: number) => {
    setDeck((prev) => {
      const clamped = Math.max(0, Math.min(MAX_COPIES, Math.floor(qty)));
      if (clamped === 0) {
        const next = { ...prev };
        delete next[cardId];
        return next;
      }
      return { ...prev, [cardId]: clamped };
    });
  }, []);

  const totalCards = React.useMemo(
    () => Object.values(deck).reduce((sum, qty) => sum + qty, 0),
    [deck],
  );

  const validation = React.useMemo(
    () => runValidation(deck, cardCache),
    [deck, cardCache],
  );

  return {
    deck,
    deckName,
    cardCache,
    addCard,
    removeCard,
    setQty,
    setDeckName,
    totalCards,
    validation,
  };
}
