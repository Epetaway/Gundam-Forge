import { describe, expect, it } from 'vitest';
import { POST as postReplay } from '@/app/api/playtester/replays/route';
import { GET as getReplay } from '@/app/api/playtester/replays/[gameId]/route';
import { GET as getReplayActions } from '@/app/api/playtester/replays/[gameId]/actions/route';
import { GET as getReplayMetrics } from '@/app/api/playtester/replays/[gameId]/metrics/route';
import { POST as postMetrics } from '@/app/api/playtester/metrics/route';

function buildReplay(gameId: string) {
  return {
    replayVersion: '1.0' as const,
    gameId,
    deckId: 'deck-route-test',
    createdAt: '2026-04-11T09:00:00.000Z',
    actions: [
      {
        id: 'log-1',
        timestamp: 100,
        turnNumber: 1,
        playerId: 'player1',
        actionType: 'DRAW',
        category: 'draw' as const,
        description: 'Player drew one card',
        rulesTrace: 'Draw phase',
      },
      {
        id: 'log-2',
        timestamp: 200,
        turnNumber: 1,
        playerId: 'player1',
        actionType: 'DECLARE_ATTACK',
        category: 'combat' as const,
        description: 'Player attacked',
        rulesTrace: 'Main phase combat',
      },
    ],
    metrics: {
      winnerPlayerId: 'player1',
      turnCount: 4,
      durationMs: 50000,
      totalActions: 2,
      actionsByCategory: { draw: 1, combat: 1 },
      actionsByPlayer: { player1: 2 },
    },
  };
}

describe('playtester API routes', () => {
  it('writes replay and reads replay/actions/metrics envelopes', async () => {
    const gameId = `route-game-${Date.now()}`;

    const saveResponse = await postReplay(
      new Request('http://localhost/api/playtester/replays', {
        method: 'POST',
        body: JSON.stringify({ replay: buildReplay(gameId) }),
      }),
    );

    expect(saveResponse.status).toBe(201);
    const savePayload = await saveResponse.json();
    expect(savePayload.ok).toBe(true);
    expect(savePayload.data.gameId).toBe(gameId);

    const replayResponse = await getReplay(
      new Request(`http://localhost/api/playtester/replays/${gameId}`, { method: 'GET' }),
      { params: { gameId } },
    );

    expect(replayResponse.status).toBe(200);
    const replayPayload = await replayResponse.json();
    expect(replayPayload.ok).toBe(true);
    expect(replayPayload.data.replay.gameId).toBe(gameId);

    const actionsResponse = await getReplayActions(
      new Request(`http://localhost/api/playtester/replays/${gameId}/actions?category=combat&limit=10`, {
        method: 'GET',
      }),
      { params: { gameId } },
    );

    expect(actionsResponse.status).toBe(200);
    const actionsPayload = await actionsResponse.json();
    expect(actionsPayload.ok).toBe(true);
    expect(actionsPayload.data.actions).toHaveLength(1);
    expect(actionsPayload.data.actions[0]?.category).toBe('combat');

    const metricsResponse = await getReplayMetrics(
      new Request(`http://localhost/api/playtester/replays/${gameId}/metrics`, { method: 'GET' }),
      { params: { gameId } },
    );

    expect(metricsResponse.status).toBe(200);
    const metricsPayload = await metricsResponse.json();
    expect(metricsPayload.ok).toBe(true);
    expect(metricsPayload.data.metrics.turnCount).toBe(4);
  });

  it('updates post-game metrics and serves updated values', async () => {
    const gameId = `route-game-${Date.now()}-metrics`;

    await postReplay(
      new Request('http://localhost/api/playtester/replays', {
        method: 'POST',
        body: JSON.stringify({ replay: buildReplay(gameId) }),
      }),
    );

    const metricsWriteResponse = await postMetrics(
      new Request('http://localhost/api/playtester/metrics', {
        method: 'POST',
        body: JSON.stringify({
          gameId,
          deckId: 'deck-route-test-v2',
          metrics: {
            winnerPlayerId: null,
            turnCount: 7,
            durationMs: 70000,
            totalActions: 20,
            actionsByCategory: { draw: 2, combat: 3 },
            actionsByPlayer: { player1: 10, player2: 10 },
          },
        }),
      }),
    );

    expect(metricsWriteResponse.status).toBe(202);
    const metricsWritePayload = await metricsWriteResponse.json();
    expect(metricsWritePayload.ok).toBe(true);

    const metricsReadResponse = await getReplayMetrics(
      new Request(`http://localhost/api/playtester/replays/${gameId}/metrics`, { method: 'GET' }),
      { params: { gameId } },
    );

    const metricsReadPayload = await metricsReadResponse.json();
    expect(metricsReadPayload.ok).toBe(true);
    expect(metricsReadPayload.data.metrics.turnCount).toBe(7);
  });

  it('returns REPLAY_NOT_FOUND and BAD_REQUEST errors consistently', async () => {
    const missingReplayResponse = await getReplay(
      new Request('http://localhost/api/playtester/replays/not-found', { method: 'GET' }),
      { params: { gameId: 'not-found' } },
    );

    expect(missingReplayResponse.status).toBe(404);
    const missingReplayPayload = await missingReplayResponse.json();
    expect(missingReplayPayload.ok).toBe(false);
    expect(missingReplayPayload.code).toBe('REPLAY_NOT_FOUND');

    const gameId = `route-game-${Date.now()}-invalid-query`;
    await postReplay(
      new Request('http://localhost/api/playtester/replays', {
        method: 'POST',
        body: JSON.stringify({ replay: buildReplay(gameId) }),
      }),
    );

    const badQueryResponse = await getReplayActions(
      new Request(`http://localhost/api/playtester/replays/${gameId}/actions?limit=5000`, {
        method: 'GET',
      }),
      { params: { gameId } },
    );

    expect(badQueryResponse.status).toBe(400);
    const badQueryPayload = await badQueryResponse.json();
    expect(badQueryPayload.ok).toBe(false);
    expect(badQueryPayload.code).toBe('BAD_REQUEST');
  });
});
