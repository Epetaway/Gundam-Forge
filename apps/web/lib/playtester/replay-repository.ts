import type {
  PlaytesterActionLogsQuery,
  PlaytesterPostGameMetrics,
  PlaytesterReplay,
} from '@gundam-forge/shared';
import { supabase } from '@/lib/supabase/client';
import {
  getPostGameMetrics as getPostGameMetricsFromMemory,
  getReplay as getReplayFromMemory,
  savePostGameMetrics as savePostGameMetricsToMemory,
  saveReplay as saveReplayToMemory,
} from '@/lib/playtester/replay-store';

interface ActionQueryResult {
  actions: PlaytesterReplay['actions'];
  nextCursor?: string;
  total: number;
}

function actionCursor(action: PlaytesterReplay['actions'][number]): string {
  return `${action.timestamp}:${action.id}`;
}

function compareActions(
  a: PlaytesterReplay['actions'][number],
  b: PlaytesterReplay['actions'][number],
): number {
  const byTimestamp = a.timestamp - b.timestamp;
  if (byTimestamp !== 0) return byTimestamp;
  return a.id.localeCompare(b.id);
}

function queryReplayActions(
  replay: PlaytesterReplay,
  query: PlaytesterActionLogsQuery,
): ActionQueryResult {
  let actions = [...replay.actions].sort(compareActions);

  if (query.category) {
    actions = actions.filter((action) => action.category === query.category);
  }

  if (query.playerId) {
    const normalizedPlayerId = query.playerId.trim().toLowerCase();
    actions = actions.filter((action) => action.playerId.toLowerCase() === normalizedPlayerId);
  }

  const total = actions.length;

  let start = 0;
  if (query.cursor) {
    const index = actions.findIndex((action) => actionCursor(action) === query.cursor);
    if (index >= 0) {
      start = index + 1;
    }
  }

  const end = start + query.limit;
  const page = actions.slice(start, end);
  const nextCursor = actions[end] ? actionCursor(actions[end]) : undefined;

  return { actions: page, nextCursor, total };
}

// Postgres error code for "relation does not exist" — migration 023 not yet applied.
function isMissingTable(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === '42P01'
  );
}

export async function saveReplay(replay: PlaytesterReplay): Promise<void> {
  if (!supabase) {
    saveReplayToMemory(replay);
    return;
  }

  const { error: replayError } = await supabase
    .from('playtester_replays')
    .upsert(
      {
        game_id: replay.gameId,
        deck_id: replay.deckId,
        replay_version: replay.replayVersion,
        replay,
      },
      { onConflict: 'game_id' },
    );

  if (replayError) {
    if (isMissingTable(replayError)) {
      saveReplayToMemory(replay);
      return;
    }
    throw replayError;
  }

  const { error: metricsError } = await supabase
    .from('playtester_metrics')
    .upsert(
      {
        game_id: replay.gameId,
        deck_id: replay.deckId,
        metrics: replay.metrics,
      },
      { onConflict: 'game_id' },
    );

  if (metricsError) {
    if (isMissingTable(metricsError)) {
      saveReplayToMemory(replay);
      return;
    }
    throw metricsError;
  }
}

export async function getReplay(gameId: string): Promise<PlaytesterReplay | null> {
  if (!supabase) {
    return getReplayFromMemory(gameId);
  }

  const { data, error } = await supabase
    .from('playtester_replays')
    .select('replay')
    .eq('game_id', gameId)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) return getReplayFromMemory(gameId);
    throw error;
  }

  if (!data || typeof data.replay !== 'object' || data.replay === null) {
    return null;
  }

  return data.replay as PlaytesterReplay;
}

export async function savePostGameMetrics(
  gameId: string,
  deckId: string,
  metrics: PlaytesterPostGameMetrics,
): Promise<void> {
  if (!supabase) {
    savePostGameMetricsToMemory(gameId, deckId, metrics);
    return;
  }

  const { error: metricsError } = await supabase
    .from('playtester_metrics')
    .upsert(
      {
        game_id: gameId,
        deck_id: deckId,
        metrics,
      },
      { onConflict: 'game_id' },
    );

  if (metricsError) {
    if (isMissingTable(metricsError)) {
      savePostGameMetricsToMemory(gameId, deckId, metrics);
      return;
    }
    throw metricsError;
  }

  const replay = await getReplay(gameId);
  if (!replay) {
    return;
  }

  await saveReplay({
    ...replay,
    deckId,
    metrics,
  });
}

export async function getPostGameMetrics(gameId: string): Promise<PlaytesterPostGameMetrics | null> {
  if (!supabase) {
    return getPostGameMetricsFromMemory(gameId);
  }

  const { data, error } = await supabase
    .from('playtester_metrics')
    .select('metrics')
    .eq('game_id', gameId)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) return getPostGameMetricsFromMemory(gameId);
    throw error;
  }

  if (!data || typeof data.metrics !== 'object' || data.metrics === null) {
    return null;
  }

  return data.metrics as PlaytesterPostGameMetrics;
}

export async function listReplayActions(
  gameId: string,
  query: PlaytesterActionLogsQuery,
): Promise<ActionQueryResult> {
  const replay = await getReplay(gameId);
  if (!replay) {
    return { actions: [], total: 0 };
  }

  return queryReplayActions(replay, query);
}