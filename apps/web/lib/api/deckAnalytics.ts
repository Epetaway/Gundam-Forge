import { fetchApiDataOrThrow } from '@/lib/api/client';

// ── DTOs matching the API route responses ────────────────────────────────────

export interface DeckAnalyticsDto {
  deckId: string;
  snapshotDate: string;
  viewCountDelta: number;
  likeCountDelta: number;
  metaProximityScore: number;
  consistencyIndex: number;
  archetypePopularityRank: number | null;
  colorComboRank: number | null;
  trendDirection: 'up' | 'flat' | 'down';
  sparklineDates: string[];
  sparklineScores: number[];
}

export interface DeckCardAnalyticsDto {
  cardId: string;
  inclusionRateInArchetype: number;
  performanceScore: number;
  trendDirection: 'up' | 'flat' | 'down';
}

export interface DeckMetaComparisonDto {
  deckId: string;
  deckArchetype: string;
  metaProximityScore: number;
  topArchetypes: string[];
  archetypeMetaShares: number[];
  archetypeWinRates: number[];
}

interface AnalyticsResponse<T> {
  analytics: T;
}

interface CardAnalyticsResponse {
  cards: DeckCardAnalyticsDto[];
}

interface ComparisonResponse {
  comparison: DeckMetaComparisonDto;
}

export async function fetchDeckAnalytics(deckId: string): Promise<DeckAnalyticsDto | null> {
  try {
    const payload = await fetchApiDataOrThrow<AnalyticsResponse<DeckAnalyticsDto>>(
      `/api/decks/${encodeURIComponent(deckId)}/analytics`,
    );
    return payload.analytics;
  } catch {
    return null;
  }
}

export async function fetchDeckCardAnalytics(deckId: string): Promise<DeckCardAnalyticsDto[]> {
  try {
    const payload = await fetchApiDataOrThrow<CardAnalyticsResponse>(
      `/api/decks/${encodeURIComponent(deckId)}/analytics/cards`,
    );
    return payload.cards;
  } catch {
    return [];
  }
}

export async function fetchDeckMetaComparison(deckId: string): Promise<DeckMetaComparisonDto | null> {
  try {
    const payload = await fetchApiDataOrThrow<ComparisonResponse>(
      `/api/decks/${encodeURIComponent(deckId)}/analytics/comparison`,
    );
    return payload.comparison;
  } catch {
    return null;
  }
}
