import cardsCatalogJson from '@/lib/data/cards.catalog.json';
import type { CardColor, CardDefinition, CardType } from '@gundam-forge/shared';
import { withBasePath } from '@/lib/utils/basePath';

export type CatalogFilters = {
  query?: string;
  color?: CardColor | 'All';
  type?: CardType | 'All';
  set?: string;
};

type CardImageRef = Pick<CardDefinition, 'id' | 'imageUrl' | 'placeholderArt'>;

export const cards = cardsCatalogJson as CardDefinition[];
export const cardsById = new Map(cards.map((card) => [card.id, card]));
export const allSets = Array.from(new Set(cards.map((card) => card.set))).sort();

export function getCards(filters: CatalogFilters = {}): CardDefinition[] {
  const query = filters.query?.trim().toLowerCase();

  return cards.filter((card) => {
    if (query) {
      const haystack = `${card.id} ${card.name} ${card.text ?? ''}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    if (filters.color && filters.color !== 'All' && card.color !== filters.color) return false;
    if (filters.type && filters.type !== 'All' && card.type !== filters.type) return false;
    if (filters.set && filters.set !== 'All' && card.set !== filters.set) return false;

    return true;
  });
}

export function getCard(id: string): CardDefinition | undefined {
  return cardsById.get(id);
}

export function getCardImage(card: CardImageRef): string {
  if (card.imageUrl?.startsWith('/card_art/')) return withBasePath(card.imageUrl);
  if (card.imageUrl) return card.imageUrl;
  if (card.placeholderArt) return card.placeholderArt;
  return withBasePath(`/card_art/${card.id}.webp`);
}
