import cardsJson from '@/lib/data/cards.json';
import type { CardColor, CardDefinition, CardType } from '@gundam-forge/shared';

export type CatalogFilters = {
  query?: string;
  color?: CardColor | 'All';
  type?: CardType | 'All';
  set?: string;
};

const rawCards = cardsJson as CardDefinition[];
const PLACEHOLDER_IMAGE_HOST = 'placehold.co';
const LOW_QUALITY_CARD_IDS = new Set(['ST02-005B', 'ST02-010B']);

function isPlaceholderUrl(value?: string): boolean {
  if (!value) return false;

  try {
    const url = new URL(value);
    return url.hostname === PLACEHOLDER_IMAGE_HOST || url.hostname.endsWith(`.${PLACEHOLDER_IMAGE_HOST}`);
  } catch {
    return value.includes(PLACEHOLDER_IMAGE_HOST);
  }
}

function hasRenderableCardArt(card: Pick<CardDefinition, 'id' | 'imageUrl'>): boolean {
  if (LOW_QUALITY_CARD_IDS.has(card.id)) return false;
  return typeof card.imageUrl === 'string' && card.imageUrl.trim().length > 0 && !isPlaceholderUrl(card.imageUrl);
}

export const cards = rawCards.filter(hasRenderableCardArt);
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

const OFFICIAL_CARD_ART_BASE = 'https://www.gundam-gcg.com/en/images/cards/card';
const EXBURST_BASE = 'https://exburst.dev/gundam/cards/sd';
const LOCAL_IMAGE_EXTENSIONS = ['webp', 'png', 'jpg', 'jpeg'] as const;
const REMOTE_VARIANT_SUFFIXES = ['', '_p1', '_p2', '_p3', '_p4', '_p5'] as const;
type CardImageRef = Pick<CardDefinition, 'id' | 'imageUrl' | 'placeholderArt'>;

function toLocalImagePath(cardId: string, ext: string = 'webp'): string {
  const normalized = LOCAL_IMAGE_EXTENSIONS.includes(ext as (typeof LOCAL_IMAGE_EXTENSIONS)[number])
    ? ext
    : 'webp';
  return `/card_art/${cardId}.${normalized}`;
}

function officialImageCandidates(cardId: string): string[] {
  const urls: string[] = [];
  for (const variant of REMOTE_VARIANT_SUFFIXES) {
    for (const ext of LOCAL_IMAGE_EXTENSIONS) {
      urls.push(`${OFFICIAL_CARD_ART_BASE}/${cardId}${variant}.${ext}`);
    }
  }
  return urls;
}

/**
 * Resolve the best single image URL for a card.
 * Prefers local /card_art/ paths so images are served from our own origin.
 * Next.js <Image> automatically prepends basePath for local paths.
 */
export function getCardImage(card: CardImageRef): string {
  const imageUrl = card.imageUrl;
  const canonicalLocal = toLocalImagePath(card.id, 'webp');
  const officialPrimary = `${OFFICIAL_CARD_ART_BASE}/${card.id}.webp`;

  // For known card-art remotes, always prefer canonical local cache by card id.
  // This avoids broken filenames from upstream URL suffixes like "_p1.webp?26013001".
  if (imageUrl) {
    try {
      const url = new URL(imageUrl);
      if (url.hostname === 'www.gundam-gcg.com' || url.hostname === 'gundam-gcg.com') return canonicalLocal;
      if (url.hostname === 'exburst.dev') return canonicalLocal;
    } catch {
      // Not a full URL — fall through
    }
  }

  // Local path — fastest in static export and avoids remote latency.
  if (imageUrl?.startsWith('/')) return imageUrl;

  // Any other external URL (placehold.co, etc.).
  if (imageUrl?.startsWith('http://') || imageUrl?.startsWith('https://')) return imageUrl;

  // Fallback chain: local path -> official HQ -> placeholder
  if (card.placeholderArt) return canonicalLocal;
  return canonicalLocal;
}

/**
 * Returns an ordered fallback URL array for use in client-side <img> onError chains.
 *
 * Priority:
 *   1. Local /card_art/{id}.{ext} cache
 *   2. Official gundam-gcg.com URLs (base + promo variants)
 *   3. exburst.dev remote mirror
 *   4. placeholderArt
 */
export function getCardFallback(card: CardImageRef): string[] {
  const officialFallbacks = officialImageCandidates(card.id);
  const localFallbacks = LOCAL_IMAGE_EXTENSIONS.map((ext) => toLocalImagePath(card.id, ext));
  const remoteFallbacks = LOCAL_IMAGE_EXTENSIONS.map((ext) => `${EXBURST_BASE}/${card.id}.${ext}`);
  const fallbacks: string[] = [...localFallbacks, ...officialFallbacks, ...remoteFallbacks];
  if (card.placeholderArt) fallbacks.push(card.placeholderArt);
  return fallbacks;
}
