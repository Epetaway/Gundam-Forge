import type { CardDefinition } from '@gundam-forge/shared';
import type { CatalogFilters } from '@/lib/data/cards';
import { withBasePath } from '@/lib/utils/basePath';

interface CardsApiResponse {
  cards: CardDefinition[];
}

function buildCardParams(filters: CatalogFilters): URLSearchParams {
  const params = new URLSearchParams();
  const query = filters.query?.trim();

  if (query) params.set('q', query);
  if (filters.color && filters.color !== 'All') params.set('color', filters.color);
  if (filters.type && filters.type !== 'All') params.set('type', filters.type);
  if (filters.set && filters.set !== 'All') params.set('set', filters.set);

  return params;
}

export async function fetchCards(filters: CatalogFilters = {}): Promise<CardDefinition[]> {
  const params = buildCardParams(filters);
  const path = params.size > 0 ? `/api/cards?${params.toString()}` : '/api/cards';
  const url = withBasePath(path);
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to fetch cards (${response.status})`);
  }

  const payload = (await response.json()) as CardsApiResponse;
  return payload.cards;
}
