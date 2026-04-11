import type { PlaytesterPostGameMetrics, PlaytesterReplay } from '@gundam-forge/shared';

interface ActionQuery {
  category?: PlaytesterReplay['actions'][number]['category'];
  playerId?: string;
  limit: number;
  cursor?: string;
}

interface ActionQueryResult {
  actions: PlaytesterReplay['actions'];
  nextCursor?: string;
  total: number;
}

const replayStore = new Map<string, PlaytesterReplay>();
const metricsStore = new Map<string, PlaytesterPostGameMetrics>();

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

export function saveReplay(replay: PlaytesterReplay): void {
  replayStore.set(replay.gameId, replay);
  metricsStore.set(replay.gameId, replay.metrics);
}

export function savePostGameMetrics(gameId: string, deckId: string, metrics: PlaytesterPostGameMetrics): void {
  const existing = replayStore.get(gameId);
  if (existing) {
    replayStore.set(gameId, {
      ...existing,
      deckId,
      metrics,
    });
  }

  metricsStore.set(gameId, metrics);
}

export function getReplay(gameId: string): PlaytesterReplay | null {
  return replayStore.get(gameId) ?? null;
}

export function getPostGameMetrics(gameId: string): PlaytesterPostGameMetrics | null {
  return metricsStore.get(gameId) ?? null;
}

export function listReplayActions(gameId: string, query: ActionQuery): ActionQueryResult {
  const replay = getReplay(gameId);
  if (!replay) {
    return { actions: [], total: 0 };
  }

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

export function makeActionCursor(
  action: Pick<PlaytesterReplay['actions'][number], 'id' | 'timestamp'>,
): string {
  return `${action.timestamp}:${action.id}`;
}
