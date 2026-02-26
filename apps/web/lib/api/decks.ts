import type { DeckRecord } from '@/lib/data/decks';
import type { DeckQueryFilters } from '@/lib/query/keys';

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
  const url = params.size > 0 ? `/api/decks?${params.toString()}` : '/api/decks';
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to fetch decks (${response.status})`);
  }

  const payload = (await response.json()) as DecksApiResponse;
  return payload.decks;
}
