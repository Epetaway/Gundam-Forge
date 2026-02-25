import cardsJson from '@/src/data/cards.json';
import type { CardColor, CardDefinition, CardType } from '@gundam-forge/shared';

export type CatalogFilters = {
  query?: string;
  color?: CardColor | 'All';
  type?: CardType | 'All';
  set?: string;
};

export const cards = cardsJson as CardDefinition[];
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

export function getCardImage(card: CardDefinition): string {
  const imageUrl = card.imageUrl;

  // Use non-gcg external URLs directly. gundam-gcg.com blocks cross-origin
  // image requests, and local /card_art/ paths are not deployed to GitHub Pages.
  if (
    imageUrl &&
    (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) &&
    !imageUrl.includes('gundam-gcg.com')
  ) {
    return imageUrl;
  }

  // Derive from community CDN (project's configured CARD_ART_BASE_URL).
  return `https://exburst.dev/gundam/cards/sd/${card.id}.webp`;
}
