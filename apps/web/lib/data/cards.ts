import cardsCatalogJson from '@/lib/data/cards.catalog.json';
import type { CardColor, CardDefinition, CardType } from '@gundam-forge/shared';
import { isExCard, isMainDeckCard, isResourceCard } from '@gundam-forge/shared';
import { withBasePath } from '@/lib/utils/basePath';
import { extractEffectKeywords } from '@/lib/search/extractEffectKeywords';
import type { CatalogFilters, FilterMatchMode } from '@/lib/filters/cardFilters';
import { matchesSelectedValues } from '@/lib/filters/cardFilters';

type CardImageRef = Pick<CardDefinition, 'id' | 'imageUrl' | 'placeholderArt'>;

export const cards = cardsCatalogJson as CardDefinition[];
export const cardsById = new Map(cards.map((card) => [card.id, card]));
export const cardsRecord = Object.fromEntries(cards.map((card) => [card.id, card])) as Record<string, CardDefinition>;
export const allSets = Array.from(new Set(cards.map((card) => card.set))).sort();

function hasKeyword(card: CardDefinition, keyword: string): boolean {
  const normalized = keyword.toLowerCase();
  return (card.keywords ?? []).some((entry) => entry.toLowerCase().includes(normalized));
}

function normalizeColorValue(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase();
}

function inDeckRole(card: CardDefinition, deckRole: NonNullable<CatalogFilters['deckRole']>): boolean {
  if (deckRole === 'All') return true;
  if (deckRole === 'ex') return isExCard(card);
  if (deckRole === 'resource') return isResourceCard(card);
  return isMainDeckCard(card); // 'main'
}

function toMatchMode(mode: CatalogFilters['matchMode']): FilterMatchMode {
  return mode === 'broad' ? 'broad' : 'strict';
}

// --- Card Enrichment ---
// Populates keywords, triggers, and clans by parsing card text and traits.
// Runs once at module load so all consumers automatically get enriched data.

const KEYWORD_PATTERNS: [RegExp, string][] = [
  [/<Repair/i,         'repair'],
  [/<Breach/i,         'breach'],
  [/<Blocker>/i,       'blocker'],
  [/<High-Maneuver>/i, 'high_maneuver'],
  [/<First Strike>/i,  'first_strike'],
  [/<Suppression/i,    'suppression'],
  [/<Support>/i,       'support'],
];

const TRIGGER_PATTERNS: [RegExp, string][] = [
  [/【Deploy】/,      'deploy'],
  [/【Burst】/,       'burst'],
  [/【Attack】/,      'attack_trigger'],
  [/【When Paired】/, 'when_paired'],
  [/【During Pair】/, 'during_pair'],
  [/【When Linked】/, 'when_linked'],
  [/【During Link】/, 'during_link'],
  [/【Destroyed】/,   'destroyed'],
  [/【Main】/,        'activate_main'],
  [/【Action】/,      'activate_action'],
];

function enrichCard(card: CardDefinition): void {
  const text = card.text ?? '';

  if (!card.keywords || card.keywords.length === 0) {
    card.keywords = KEYWORD_PATTERNS
      .filter(([pattern]) => pattern.test(text))
      .map(([, tag]) => tag);
  }

  if (!card.triggers || card.triggers.length === 0) {
    card.triggers = TRIGGER_PATTERNS
      .filter(([pattern]) => pattern.test(text))
      .map(([, tag]) => tag);
  }

  if (!card.clans || card.clans.length === 0) {
    const clanSet = new Set<string>();
    for (const trait of card.traits ?? []) {
      for (const m of trait.matchAll(/\(([^)]+)\)/g)) {
        clanSet.add(m[1]);
      }
    }
    card.clans = [...clanSet];
  }

  // Enrich with effect keywords for advanced search
  if (!(card as any).effectKeywords) {
    (card as any).effectKeywords = extractEffectKeywords(text);
  }
}

cards.forEach(enrichCard);

function applyCardFilters(source: CardDefinition[], filters: CatalogFilters = {}): CardDefinition[] {
  const query = filters.query?.trim().toLowerCase();
  const matchMode = toMatchMode(filters.matchMode);

  return source.filter((card) => {
    if (query) {
      const haystack = `${card.id} ${card.name} ${card.text ?? ''} ${(card.traits ?? []).join(' ')} ${(card.clans ?? []).join(' ')}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }

    // Multi-color OR filter (overrides scalar if both present)
    if (filters.colors && filters.colors.length > 0) {
      const colorSet = new Set(filters.colors.map(normalizeColorValue));
      if (!colorSet.has(normalizeColorValue(card.color))) return false;
    } else if (
      filters.color &&
      filters.color !== 'All' &&
      normalizeColorValue(card.color) !== normalizeColorValue(filters.color)
    ) {
      return false;
    }
    if (filters.type && filters.type !== 'All' && card.type !== filters.type) return false;
    if (filters.set && filters.set !== 'All' && card.set !== filters.set) return false;
    if (filters.zone && filters.zone !== 'All' && (card.zone ?? '').toLowerCase() !== filters.zone.toLowerCase()) return false;
    if (filters.keyword && filters.keyword !== 'All' && !hasKeyword(card, filters.keyword)) return false;
    if (filters.deckRole && filters.deckRole !== 'All' && !inDeckRole(card, filters.deckRole)) return false;
    if (!matchesSelectedValues(card.clans, filters.clans ?? [], matchMode)) return false;
    if (!matchesSelectedValues(card.traits, filters.traits ?? [], matchMode)) return false;
    if (!matchesSelectedValues(card.keywords, filters.keywords ?? [], matchMode)) return false;
    if (!matchesSelectedValues(card.triggers, filters.triggers ?? [], matchMode)) return false;

    return true;
  });
}

export function getCards(filters: CatalogFilters = {}): CardDefinition[] {
  return applyCardFilters(cards, filters);
}

export function getCardsFromSource(source: CardDefinition[], filters: CatalogFilters = {}): CardDefinition[] {
  return applyCardFilters(source, filters);
}

export function getCardById(id: string): CardDefinition | undefined {
  return cardsById.get(id);
}

export function getCardList({
  q,
  limit,
  cursor,
  excludeTypes,
  ...filters
}: (CatalogFilters & { q?: string; limit?: number; cursor?: string; excludeTypes?: string[] })): {
  results: CardDefinition[];
  nextCursor?: string;
  total: number;
} {
  const effectiveFilters: CatalogFilters = {
    ...filters,
    query: filters.query ?? q,
  };

  let filtered = getCards(effectiveFilters);
  if (excludeTypes && excludeTypes.length > 0) {
    filtered = filtered.filter((card) => !excludeTypes.includes(card.type));
  }

  // Keep cursor deterministic by sorting by id.
  filtered = [...filtered].sort((a, b) => a.id.localeCompare(b.id));

  const pageSize = Number.isFinite(limit) && (limit ?? 0) > 0 ? (limit as number) : 30;
  let startIdx = 0;
  if (cursor) {
    const idx = filtered.findIndex((card) => card.id === cursor);
    if (idx >= 0) startIdx = idx + 1;
  }

  const results = filtered.slice(startIdx, startIdx + pageSize);
  const nextCursor = filtered[startIdx + pageSize]?.id;
  return { results, nextCursor, total: filtered.length };
}

export function getCard(id: string): CardDefinition | undefined {
  return cardsById.get(id);
}

/**
 * Get production card image URL with automatic fallbacks
 * 
 * Priority:
 * 1. Local /card_art/{id}.webp (bundled, reliable)
 * 2. Existing imageUrl if valid (database value)
 * 3. Fallback to CDN/placeholder (handled by component)
 * 
 * Note: Use CardImage component for automatic error handling
 * and fallback chain. Direct img tags should use onError handlers.
 */
export function getCardImage(card: CardImageRef): string {
  // Prefer local card_art if available
  if (card.imageUrl?.startsWith('/card_art/')) {
    return withBasePath(card.imageUrl);
  }
  
  // Otherwise use existing imageUrl if not a placeholder
  if (card.imageUrl && !card.imageUrl.includes('placehold')) {
    return card.imageUrl;
  }
  
  // Fallback to legacy placeholder field if present
  if (card.placeholderArt) {
    return card.placeholderArt;
  }
  
  // Default: local card_art - component will handle fallback chain if missing
  return withBasePath(`/card_art/${card.id}.webp`);
}
