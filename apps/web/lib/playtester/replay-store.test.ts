import { describe, expect, it } from 'vitest';
import type { PlaytesterReplay } from '@gundam-forge/shared';
import {
  getPostGameMetrics,
  getReplay,
  listReplayActions,
  makeActionCursor,
  savePostGameMetrics,
  saveReplay,
} from '@/lib/playtester/replay-store';

function sampleReplay(gameId: string): PlaytesterReplay {
  return {
    replayVersion: '1.0',
    gameId,
    deckId: 'deck-1',
    createdAt: '2026-04-11T00:00:00.000Z',
    actions: [
      {
        id: 'log-2',
        timestamp: 200,
        turnNumber: 1,
        playerId: 'player2',
        actionType: 'DRAW',
        category: 'draw',
        description: 'p2 draw',
        rulesTrace: 'draw',
      },
      {
        id: 'log-1',
        timestamp: 100,
        turnNumber: 1,
        playerId: 'player1',
        actionType: 'PLAY_CARD',
        category: 'main',
        description: 'p1 play',
        rulesTrace: 'main',
      },
      {
        id: 'log-3',
        timestamp: 200,
        turnNumber: 1,
        playerId: 'player1',
        actionType: 'DECLARE_ATTACK',
        category: 'combat',
        description: 'p1 attack',
        rulesTrace: 'combat',
      },
    ],
    metrics: {
      winnerPlayerId: 'player1',
      turnCount: 5,
      durationMs: 60000,
      totalActions: 3,
      actionsByCategory: { draw: 1, main: 1, combat: 1 },
      actionsByPlayer: { player1: 2, player2: 1 },
    },
  };
}

describe('playtester replay store', () => {
  it('stores and fetches replay by game id', () => {
    const replay = sampleReplay('game-store-1');
    saveReplay(replay);

    const loaded = getReplay('game-store-1');
    expect(loaded?.gameId).toBe('game-store-1');
    expect(loaded?.actions).toHaveLength(3);
  });

  it('filters and paginates actions deterministically', () => {
    const replay = sampleReplay('game-store-2');
    saveReplay(replay);

    const firstPage = listReplayActions('game-store-2', {
      category: undefined,
      playerId: undefined,
      limit: 2,
      cursor: undefined,
    });

    expect(firstPage.actions.map((a) => a.id)).toEqual(['log-1', 'log-2']);
    expect(firstPage.nextCursor).toBe('200:log-3');
    expect(firstPage.total).toBe(3);

    const secondPage = listReplayActions('game-store-2', {
      category: undefined,
      playerId: undefined,
      limit: 2,
      cursor: firstPage.nextCursor,
    });

    expect(secondPage.actions).toHaveLength(0);
  });

  it('applies category and player filters', () => {
    const replay = sampleReplay('game-store-3');
    saveReplay(replay);

    const filtered = listReplayActions('game-store-3', {
      category: 'combat',
      playerId: 'PLAYER1',
      limit: 50,
      cursor: undefined,
    });

    expect(filtered.actions.map((a) => a.id)).toEqual(['log-3']);
    expect(filtered.total).toBe(1);
  });

  it('updates metrics independent of replay action writes', () => {
    savePostGameMetrics('game-store-4', 'deck-m', {
      winnerPlayerId: null,
      turnCount: 7,
      durationMs: 70000,
      totalActions: 40,
      actionsByCategory: { draw: 6, main: 20 },
      actionsByPlayer: { player1: 20, player2: 20 },
    });

    const metrics = getPostGameMetrics('game-store-4');
    expect(metrics?.turnCount).toBe(7);
  });

  it('creates stable cursor values', () => {
    expect(makeActionCursor({ timestamp: 123, id: 'log-9' })).toBe('123:log-9');
  });
});
