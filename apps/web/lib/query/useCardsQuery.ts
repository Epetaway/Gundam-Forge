'use client';

import { useQuery } from '@tanstack/react-query';
import type { CardDefinition } from '@gundam-forge/shared';
import { fetchCards } from '@/lib/api/cards';
import type { CatalogFilters } from '@/lib/data/cards';
import { queryKeys } from '@/lib/query/keys';

interface UseCardsQueryOptions {
  filters: CatalogFilters;
  initialData?: CardDefinition[];
}

export function useCardsQuery({ filters, initialData }: UseCardsQueryOptions) {
  return useQuery({
    queryKey: queryKeys.cards.list(filters),
    queryFn: () => fetchCards(filters),
    initialData,
  });
}
