import { describe, expect, it } from 'vitest';
import {
  CardsApiResponseSchema,
  CardsQuerySchema,
  DeckAnalyticsSummaryResponseSchema,
  DecksApiResponseSchema,
  PlaytesterMetricsGetResponseSchema,
  PlaytesterReplaySchema,
} from '@gundam-forge/shared';
import type { DeckRecord } from '@/lib/data/decks';
import { HttpError, parseRequestContract } from '@/lib/api/server';
import { compareDecksDeterministically } from '@/lib/decks/deterministicSort';

describe('API contracts', () => {
  it('parses cards query defaults deterministically', () => {
    const parsed = CardsQuerySchema.parse({});
    expect(parsed.limit).toBe(30);
    expect(parsed.excludeTypes).toBeUndefined();
  });

  it('rejects invalid cards query limit as BAD_REQUEST', () => {
    expect(() =>
      parseRequestContract(
        CardsQuerySchema,
        { limit: '999' },
        '/api/cards',
      ),
    ).toThrowError(HttpError);

    try {
      parseRequestContract(CardsQuerySchema, { limit: '999' }, '/api/cards');
    } catch (error) {
      const httpError = error as HttpError;
      expect(httpError.status).toBe(400);
      expect(httpError.code).toBe('BAD_REQUEST');
    }
  });

  it('validates cards response payload shape', () => {
    const parsed = CardsApiResponseSchema.parse({
      cards: [
        {
          id: 'GD01-001',
          name: 'Test Unit',
          color: 'Blue',
          cost: 3,
          type: 'Unit',
          set: 'GD01',
        },
      ],
      total: 1,
      limit: 30,
      nextCursor: 'GD01-002',
      appliedFilters: {
        color: 'Blue',
        matchMode: 'strict',
      },
    });

    expect(parsed.total).toBe(1);
  });

  it('validates decks response payload shape', () => {
    const parsed = DecksApiResponseSchema.parse({
      decks: [
        {
          id: 'test-deck',
          name: 'Test Deck',
          description: 'Test',
          archetype: 'Aggro',
          owner: 'QA',
          colors: ['Red'],
          likes: 10,
          views: 20,
          entries: [{ cardId: 'GD01-001', qty: 3 }],
        },
      ],
    });

    expect(parsed.decks).toHaveLength(1);
  });

  it('validates nullable deck analytics summary payload', () => {
    const parsed = DeckAnalyticsSummaryResponseSchema.parse({
      analytics: null,
    });

    expect(parsed.analytics).toBeNull();
  });

  it('enforces replay versioned playtester payload', () => {
    const parsed = PlaytesterReplaySchema.parse({
      replayVersion: '1.0',
      gameId: 'game-1',
      deckId: 'deck-1',
      createdAt: '2026-04-11T00:00:00.000Z',
      actions: [
        {
          id: 'log-0',
          timestamp: 123,
          turnNumber: 1,
          playerId: 'player1',
          actionType: 'DRAW',
          category: 'draw',
          description: 'Player drew one card',
          rulesTrace: 'Draw phase action',
        },
      ],
      metrics: {
        winnerPlayerId: 'player1',
        turnCount: 8,
        durationMs: 240000,
        totalActions: 52,
        actionsByCategory: { draw: 8, combat: 7 },
        actionsByPlayer: { player1: 26, player2: 26 },
      },
    });

    expect(parsed.replayVersion).toBe('1.0');
  });

  it('validates nullable playtester metrics response payload', () => {
    const parsed = PlaytesterMetricsGetResponseSchema.parse({
      metrics: null,
    });

    expect(parsed.metrics).toBeNull();
  });
});

describe('deterministic deck sorting', () => {
  it('falls back to name and id for complete score ties', () => {
    const input: DeckRecord[] = [
      {
        id: 'deck-b',
        name: 'Beta Deck',
        description: 'B',
        archetype: 'Aggro',
        owner: 'A',
        colors: ['Red'],
        likes: 50,
        views: 100,
        updatedAt: '2026-04-10T00:00:00Z',
        entries: [],
      },
      {
        id: 'deck-a',
        name: 'Alpha Deck',
        description: 'A',
        archetype: 'Aggro',
        owner: 'A',
        colors: ['Red'],
        likes: 50,
        views: 100,
        updatedAt: '2026-04-10T00:00:00Z',
        entries: [],
      },
    ];

    const sorted = [...input].sort(compareDecksDeterministically);
    expect(sorted[0]?.id).toBe('deck-a');
    expect(sorted[1]?.id).toBe('deck-b');
  });
});
