import { withBasePath } from '@/lib/utils/basePath';
import type { CardDefinition } from '@gundam-forge/shared';

// Minimal card shape returned by /api/cards/search
export interface CardSummary {
  id: string;
  name: string;
  cost: number;
  type: string;
  color: string;
  set: string;
  imageUrl?: string;
}

export interface CardSearchParams {
  q?: string;
  color?: string;
  type?: string;
  set?: string;
  cursor?: number;
  limit?: number;
}

export interface CardSearchResponse {
  cards: CardSummary[];
  cursor: number;
  hasMore: boolean;
  total: number;
}

export async function searchCards(params: CardSearchParams): Promise<CardSearchResponse> {
  const sp = new URLSearchParams();
  if (params.q) sp.set('q', params.q);
  if (params.color && params.color !== 'All') sp.set('color', params.color);
  if (params.type && params.type !== 'All') sp.set('type', params.type);
  if (params.set && params.set !== 'All') sp.set('set', params.set);
  if (params.cursor !== undefined) sp.set('cursor', String(params.cursor));
  if (params.limit !== undefined) sp.set('limit', String(params.limit));

  const url = withBasePath(`/api/cards/search?${sp.toString()}`);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Card search failed (${res.status})`);
  return res.json() as Promise<CardSearchResponse>;
}

export async function fetchCardDetail(id: string): Promise<CardDefinition> {
  const url = withBasePath(`/api/cards/${encodeURIComponent(id)}`);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Card not found: ${id} (${res.status})`);
  const payload = (await res.json()) as { card: CardDefinition };
  return payload.card;
}
