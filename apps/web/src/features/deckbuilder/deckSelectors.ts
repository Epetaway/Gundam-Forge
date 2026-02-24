import type { CardDefinition } from '@gundam-forge/shared';
import type { DeckEntry } from './deckStore';

export interface ResolvedDeckEntry {
  cardId: string;
  qty: number;
  isBoss: boolean;
  card: CardDefinition;
}

export const resolveDeckEntries = (entries: DeckEntry[], cardsById: Map<string, CardDefinition>): ResolvedDeckEntry[] => {
  return entries
    .map((entry) => {
      const card = cardsById.get(entry.cardId);
      if (!card) return null;
      return { cardId: entry.cardId, qty: entry.qty, isBoss: entry.isBoss ?? false, card };
    })
    .filter((entry): entry is ResolvedDeckEntry => Boolean(entry));
};

export const buildDeckSignature = (entries: DeckEntry[]) =>
  [...entries]
    .sort((a, b) => a.cardId.localeCompare(b.cardId))
    .map((entry) => `${entry.cardId}:${entry.qty}`)
    .join('|');
