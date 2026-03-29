import type { CardDefinition } from '@gundam-forge/shared';
import type { CatalogFilters } from '@/lib/filters/cardFilters';
import { filtersToSearchParams } from '@/lib/filters/cardFilters';
import { fetchApiDataOrThrow } from '@/lib/api/client';

export interface CardsApiResponse {
  cards: CardDefinition[];
  nextCursor?: string;
  total?: number;
  limit?: number;
  appliedFilters?: CatalogFilters;
}

export async function fetchCardsResult(filters: CatalogFilters = {}): Promise<CardsApiResponse> {
  const params = filtersToSearchParams(filters);
  const path = params.size > 0 ? `/api/cards?${params.toString()}` : '/api/cards';
  return fetchApiDataOrThrow<CardsApiResponse>(path);
}

export async function fetchCards(filters: CatalogFilters = {}): Promise<CardDefinition[]> {
  const payload = await fetchCardsResult(filters);
  return payload.cards;
}
