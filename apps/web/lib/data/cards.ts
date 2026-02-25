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

  // Convert gcg URLs to local paths — images are committed to public/card_art/.
  // Next.js <Image> prepends basePath automatically for local paths.
  if (imageUrl?.includes('gundam-gcg.com')) {
    try {
      const filename = new URL(imageUrl).pathname.split('/').pop();
      if (filename) return `/card_art/${filename}`;
    } catch {
      // fall through
    }
  }

  // Already a local path — Next.js <Image> injects basePath.
  if (imageUrl?.startsWith('/')) {
    return imageUrl;
  }

  // Any other external URL (placehold.co, exburst.dev, etc.).
  if (imageUrl?.startsWith('http://') || imageUrl?.startsWith('https://')) {
    return imageUrl;
  }

  // No imageUrl — show placeholder with card name text.
  if (card.placeholderArt) {
    return card.placeholderArt;
  }

  return `/card_art/${card.id}.webp`;
}
