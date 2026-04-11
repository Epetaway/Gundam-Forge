import { fetchApiDataOrThrow } from '@/lib/api/client';
import {
  isRecord,
  readNullableNumber,
  readNumber,
  readNumberArray,
  readObjectArray,
  readString,
  readStringArray,
  readTrendDirection,
} from '@/lib/api/response-guards';

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

function normalizeDeckAnalytics(value: unknown): DeckAnalyticsDto | null {
  if (!isRecord(value)) return null;

  const deckId = readString(value.deckId);
  const snapshotDate = readString(value.snapshotDate);
  const viewCountDelta = readNumber(value.viewCountDelta);
  const likeCountDelta = readNumber(value.likeCountDelta);
  const metaProximityScore = readNumber(value.metaProximityScore);
  const consistencyIndex = readNumber(value.consistencyIndex);
  const trendDirection = readTrendDirection(value.trendDirection);

  if (
    !deckId ||
    !snapshotDate ||
    viewCountDelta === undefined ||
    likeCountDelta === undefined ||
    metaProximityScore === undefined ||
    consistencyIndex === undefined ||
    !trendDirection
  ) {
    return null;
  }

  return {
    deckId,
    snapshotDate,
    viewCountDelta,
    likeCountDelta,
    metaProximityScore,
    consistencyIndex,
    archetypePopularityRank: readNullableNumber(value.archetypePopularityRank) ?? null,
    colorComboRank: readNullableNumber(value.colorComboRank) ?? null,
    trendDirection,
    sparklineDates: readStringArray(value.sparklineDates) ?? [],
    sparklineScores: readNumberArray(value.sparklineScores) ?? [],
  };
}

function normalizeDeckCardAnalytics(value: unknown): DeckCardAnalyticsDto[] {
  const rows = readObjectArray(value);
  if (!rows) return [];

  return rows.flatMap((row) => {
    const cardId = readString(row.cardId);
    const inclusionRateInArchetype = readNumber(row.inclusionRateInArchetype);
    const performanceScore = readNumber(row.performanceScore);
    const trendDirection = readTrendDirection(row.trendDirection);

    if (!cardId || inclusionRateInArchetype === undefined || performanceScore === undefined || !trendDirection) {
      return [];
    }

    return [{
      cardId,
      inclusionRateInArchetype,
      performanceScore,
      trendDirection,
    }];
  });
}

function normalizeDeckMetaComparison(value: unknown): DeckMetaComparisonDto | null {
  if (!isRecord(value)) return null;

  const deckId = readString(value.deckId);
  const deckArchetype = readString(value.deckArchetype);
  const metaProximityScore = readNumber(value.metaProximityScore);

  if (!deckId || !deckArchetype || metaProximityScore === undefined) {
    return null;
  }

  return {
    deckId,
    deckArchetype,
    metaProximityScore,
    topArchetypes: readStringArray(value.topArchetypes) ?? [],
    archetypeMetaShares: readNumberArray(value.archetypeMetaShares) ?? [],
    archetypeWinRates: readNumberArray(value.archetypeWinRates) ?? [],
  };
}

export async function fetchDeckAnalytics(deckId: string): Promise<DeckAnalyticsDto | null> {
  try {
    const payload = await fetchApiDataOrThrow<unknown>(
      `/api/deck-analytics/${encodeURIComponent(deckId)}/summary`,
    );

    if (!isRecord(payload)) {
      return null;
    }

    return normalizeDeckAnalytics(payload.analytics);
  } catch {
    return null;
  }
}

export async function fetchDeckCardAnalytics(deckId: string): Promise<DeckCardAnalyticsDto[]> {
  try {
    const payload = await fetchApiDataOrThrow<unknown>(
      `/api/deck-analytics/${encodeURIComponent(deckId)}/cards`,
    );

    if (!isRecord(payload)) {
      return [];
    }

    return normalizeDeckCardAnalytics(payload.cards);
  } catch {
    return [];
  }
}

export async function fetchDeckMetaComparison(deckId: string): Promise<DeckMetaComparisonDto | null> {
  try {
    const payload = await fetchApiDataOrThrow<unknown>(
      `/api/deck-analytics/${encodeURIComponent(deckId)}/comparison`,
    );

    if (!isRecord(payload)) {
      return null;
    }

    return normalizeDeckMetaComparison(payload.comparison);
  } catch {
    return null;
  }
}
