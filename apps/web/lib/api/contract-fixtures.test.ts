import { describe, expect, it } from 'vitest';
import {
  CardsApiResponseSchema,
  DeckAnalyticsCardsResponseSchema,
  DeckAnalyticsComparisonResponseSchema,
  DeckAnalyticsSummaryResponseSchema,
  DecksApiResponseSchema,
  PlaytesterActionLogsResponseSchema,
  PlaytesterMetricsGetResponseSchema,
  PlaytesterMetricsPostResponseSchema,
  PlaytesterReplayGetResponseSchema,
  PlaytesterReplayPostResponseSchema,
} from '@gundam-forge/shared';
import { contractFixtures } from '@/lib/api/contract-fixtures';

describe('contract fixtures', () => {
  it('validate cards fixtures', () => {
    const parsed = CardsApiResponseSchema.parse(contractFixtures.cards.success);
    expect(parsed.cards).toHaveLength(1);
  });

  it('validate decks fixtures', () => {
    const parsed = DecksApiResponseSchema.parse(contractFixtures.decks.success);
    expect(parsed.decks).toHaveLength(1);
  });

  it('validate deck analytics fixtures', () => {
    expect(DeckAnalyticsSummaryResponseSchema.parse(contractFixtures.analytics.summary).analytics).toBeTruthy();
    expect(DeckAnalyticsCardsResponseSchema.parse(contractFixtures.analytics.cards).cards).toHaveLength(1);
    expect(DeckAnalyticsComparisonResponseSchema.parse(contractFixtures.analytics.comparison).comparison).toBeTruthy();
  });

  it('validate playtester fixtures', () => {
    expect(PlaytesterReplayPostResponseSchema.parse(contractFixtures.playtester.replayWrite).accepted).toBe(true);
    expect(PlaytesterReplayGetResponseSchema.parse(contractFixtures.playtester.replayRead).replay?.gameId).toBe('game-1712800000');
    expect(PlaytesterActionLogsResponseSchema.parse(contractFixtures.playtester.actionsRead).actions).toHaveLength(1);
    expect(PlaytesterMetricsGetResponseSchema.parse(contractFixtures.playtester.metricsRead).metrics?.turnCount).toBe(8);
    expect(PlaytesterMetricsPostResponseSchema.parse(contractFixtures.playtester.metricsWrite).accepted).toBe(true);
  });
});
