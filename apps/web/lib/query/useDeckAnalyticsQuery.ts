'use client';

import { useQuery } from '@tanstack/react-query';
import {
  fetchDeckAnalytics,
  fetchDeckCardAnalytics,
  fetchDeckMetaComparison,
} from '@/lib/api/deckAnalytics';
import { queryKeys } from '@/lib/query/keys';

export function useDeckAnalyticsQuery(deckId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.deckAnalytics.detail(deckId ?? ''),
    queryFn: () => fetchDeckAnalytics(deckId!),
    enabled: !!deckId,
    staleTime: 60_000,    // analytics refresh max once per minute
    gcTime: 5 * 60_000,
  });
}

export function useDeckCardAnalyticsQuery(deckId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.deckAnalytics.cards(deckId ?? ''),
    queryFn: () => fetchDeckCardAnalytics(deckId!),
    enabled: !!deckId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}

export function useDeckMetaComparisonQuery(deckId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.deckAnalytics.comparison(deckId ?? ''),
    queryFn: () => fetchDeckMetaComparison(deckId!),
    enabled: !!deckId,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
  });
}
