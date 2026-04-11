import type { CardDefinition } from '@gundam-forge/shared';
import type { CatalogFilters } from '@/lib/filters/cardFilters';
import { filtersToSearchParams } from '@/lib/filters/cardFilters';
import { fetchApiDataOrThrow } from '@/lib/api/client';
import { isRecord, readNumber, readObjectArray, readString } from '@/lib/api/response-guards';

export interface CardsApiResponse {
  cards: CardDefinition[];
  nextCursor?: string;
  total?: number;
  limit?: number;
  appliedFilters?: CatalogFilters;
}

function normalizeCardsApiResponse(payload: unknown): CardsApiResponse {
  if (!isRecord(payload)) {
    throw new Error('Invalid /api/cards response payload');
  }

  const cards = readObjectArray(payload.cards);
  if (!cards) {
    throw new Error('Invalid /api/cards response payload: cards is missing');
  }

  return {
    cards: cards as unknown as CardDefinition[],
    nextCursor: readString(payload.nextCursor),
    total: readNumber(payload.total),
    limit: readNumber(payload.limit),
    appliedFilters: isRecord(payload.appliedFilters)
      ? (payload.appliedFilters as CatalogFilters)
      : undefined,
  };
}

export async function fetchCardsResult(filters: CatalogFilters = {}): Promise<CardsApiResponse> {
  const params = filtersToSearchParams(filters);
  const path = params.size > 0 ? `/api/cards?${params.toString()}` : '/api/cards';
  const payload = await fetchApiDataOrThrow<unknown>(path);
  return normalizeCardsApiResponse(payload);
}

export async function fetchCards(filters: CatalogFilters = {}): Promise<CardDefinition[]> {
  const payload = await fetchCardsResult(filters);
  return payload.cards;
}
