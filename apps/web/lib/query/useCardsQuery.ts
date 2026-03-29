'use client';

import { useQuery } from '@tanstack/react-query';
import type { CardDefinition } from '@gundam-forge/shared';
import { fetchCardsResult, type CardsApiResponse } from '@/lib/api/cards';
import type { CatalogFilters } from '@/lib/filters/cardFilters';
import { queryKeys } from '@/lib/query/keys';

interface UseCardsQueryOptions {
  filters: CatalogFilters;
  initialData?: CardDefinition[];
}

export function useCardsQuery({ filters, initialData }: UseCardsQueryOptions) {
  const initialPayload: CardsApiResponse | undefined = initialData
    ? {
        cards: initialData,
        total: initialData.length,
        appliedFilters: filters,
      }
    : undefined;

  return useQuery({
    queryKey: queryKeys.cards.list(filters),
    queryFn: () => fetchCardsResult(filters),
    initialData: initialPayload,
  });
}
