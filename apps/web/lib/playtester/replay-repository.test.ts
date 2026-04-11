import { describe, expect, it } from 'vitest';
import type { PlaytesterReplay } from '@gundam-forge/shared';
import {
  getPostGameMetrics,
  getReplay,
  listReplayActions,
  savePostGameMetrics,
  saveReplay,
} from '@/lib/playtester/replay-repository';

function buildReplay(gameId: string): PlaytesterReplay {
  return {
    replayVersion: '1.0',
    gameId,
    deckId: 'deck-x',
    createdAt: '2026-04-11T12:00:00.000Z',
    actions: [
      {
        id: 'a-2',
        timestamp: 200,
        turnNumber: 1,
        playerId: 'player2',
        actionType: 'DRAW',
        category: 'draw',
        description: 'draw',
        rulesTrace: 'draw',
      },
      {
        id: 'a-1',
        timestamp: 100,
        turnNumber: 1,
        playerId: 'player1',
        actionType: 'PLAY_CARD',
        category: 'main',
        description: 'main',
        rulesTrace: 'main',
      },
    ],
    metrics: {
      winnerPlayerId: 'player1',
      turnCount: 3,
      durationMs: 40000,
      totalActions: 2,
      actionsByCategory: { draw: 1, main: 1 },
      actionsByPlayer: { player1: 1, player2: 1 },
    },
  };
}

describe('playtester replay repository', () => {
  it('saves and loads replay', async () => {
    const replay = buildReplay('repo-test-1');
    await saveReplay(replay);

    const loaded = await getReplay('repo-test-1');
    expect(loaded?.gameId).toBe('repo-test-1');
    expect(loaded?.metrics.turnCount).toBe(3);
  });

  it('paginates replay actions deterministically', async () => {
    await saveReplay(buildReplay('repo-test-2'));

    const page = await listReplayActions('repo-test-2', {
      limit: 1,
      cursor: undefined,
      category: undefined,
      playerId: undefined,
    });

    expect(page.actions.map((action) => action.id)).toEqual(['a-1']);
    expect(page.nextCursor).toBe('200:a-2');
  });

  it('updates and reads metrics', async () => {
    await saveReplay(buildReplay('repo-test-3'));

    await savePostGameMetrics('repo-test-3', 'deck-z', {
      winnerPlayerId: null,
      turnCount: 9,
      durationMs: 99000,
      totalActions: 70,
      actionsByCategory: { draw: 9, main: 30 },
      actionsByPlayer: { player1: 35, player2: 35 },
    });

    const metrics = await getPostGameMetrics('repo-test-3');
    const replay = await getReplay('repo-test-3');

    expect(metrics?.turnCount).toBe(9);
    expect(replay?.deckId).toBe('deck-z');
    expect(replay?.metrics.turnCount).toBe(9);
  });
});
