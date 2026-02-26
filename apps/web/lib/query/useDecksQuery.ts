'use client';

import { useQuery } from '@tanstack/react-query';
import type { DeckRecord } from '@/lib/data/decks';
import { fetchDecks } from '@/lib/api/decks';
import type { DeckQueryFilters } from '@/lib/query/keys';
import { queryKeys } from '@/lib/query/keys';

interface UseDecksQueryOptions {
  filters?: DeckQueryFilters;
  initialData?: DeckRecord[];
}

export function useDecksQuery({ filters = {}, initialData }: UseDecksQueryOptions) {
  return useQuery({
    queryKey: queryKeys.decks.list(filters),
    queryFn: () => fetchDecks(filters),
    initialData,
  });
}
