import type { DeckRecord } from '@/lib/data/decks';
import type { DeckQueryFilters } from '@/lib/query/keys';
import { fetchApiDataOrThrow } from '@/lib/api/client';

interface DecksApiResponse {
  decks: DeckRecord[];
}

function buildDeckParams(filters: DeckQueryFilters): URLSearchParams {
  const params = new URLSearchParams();
  const query = filters.query?.trim();

  if (query) params.set('q', query);
  if (filters.color) params.set('color', filters.color);
  if (filters.archetype) params.set('archetype', filters.archetype);

  return params;
}

export async function fetchDecks(filters: DeckQueryFilters = {}): Promise<DeckRecord[]> {
  const params = buildDeckParams(filters);
  const path = params.size > 0 ? `/api/decks?${params.toString()}` : '/api/decks';
  const payload = await fetchApiDataOrThrow<DecksApiResponse>(path);
  return payload.decks;
}
