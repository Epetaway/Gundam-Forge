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

const EXBURST_BASE = 'https://exburst.dev/gundam/cards/sd';

/**
 * Resolve the best single image URL for a card.
 * Prefers local /card_art/ paths so images are served from our own origin.
 * Next.js <Image> automatically prepends basePath for local paths.
 */
export function getCardImage(card: CardDefinition): string {
  const imageUrl = card.imageUrl;

  // Convert known remote origins to local paths (committed to public/card_art/).
  if (imageUrl) {
    try {
      const url = new URL(imageUrl);
      if (
        url.hostname === 'www.gundam-gcg.com' ||
        url.hostname === 'gundam-gcg.com' ||
        url.hostname === 'exburst.dev'
      ) {
        const filename = url.pathname.split('/').pop();
        if (filename) return `/card_art/${filename}`;
      }
    } catch {
      // Not a full URL — fall through
    }
  }

  // Already a local path — Next.js <Image> injects basePath.
  if (imageUrl?.startsWith('/')) return imageUrl;

  // Any other external URL (placehold.co, etc.).
  if (imageUrl?.startsWith('http://') || imageUrl?.startsWith('https://')) return imageUrl;

  // Fallback chain: placeholderArt → derived local path
  if (card.placeholderArt) return card.placeholderArt;
  return `/card_art/${card.id}.webp`;
}

/**
 * Returns an ordered fallback URL array for use in client-side <img> onError chains.
 *
 * Priority:
 *   1. Local /card_art/{id}.webp  — served from own origin, fastest
 *   2. exburst.dev remote URL     — canonical upstream source
 *   3. placeholderArt             — always-available SVG placeholder
 */
export function getCardFallback(card: CardDefinition): string[] {
  const fallbacks: string[] = [
    `/card_art/${card.id}.webp`,
    `${EXBURST_BASE}/${card.id}.webp`,
  ];
  if (card.placeholderArt) fallbacks.push(card.placeholderArt);
  return fallbacks;
}
