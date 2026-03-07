import type {
  MetaSourceArchetype,
  MetaSourceCardPerformance,
  MetaSourcePayload,
  TrendDirection,
} from './types';

function normalizeTrend(value?: string): TrendDirection {
  if (value === 'up' || value === 'down' || value === 'flat') return value;
  return 'flat';
}

function normalizeArchetype(entry: MetaSourceArchetype): MetaSourceArchetype {
  return {
    archetypeId: entry.archetypeId.trim(),
    rank: Math.max(1, Math.floor(entry.rank)),
    winRate: entry.winRate,
    playRate: entry.playRate,
    weightedScore: entry.weightedScore,
    trendDirection: normalizeTrend(entry.trendDirection),
  };
}

function normalizeCardPerformance(entry: MetaSourceCardPerformance): MetaSourceCardPerformance {
  return {
    cardId: entry.cardId.trim(),
    archetypeId: entry.archetypeId.trim(),
    inclusionRate: entry.inclusionRate,
    winImpact: entry.winImpact,
    sampleSize: entry.sampleSize ?? 0,
  };
}

export function normalizeMetaPayload(payload: MetaSourcePayload): MetaSourcePayload {
  const archetypes = payload.archetypes
    .map(normalizeArchetype)
    .sort((a: MetaSourceArchetype, b: MetaSourceArchetype) => a.rank - b.rank);

  const topArchetypes = payload.topArchetypes.length
    ? payload.topArchetypes
    : archetypes.slice(0, 5).map((entry: MetaSourceArchetype) => entry.archetypeId);

  const cardPerformance = payload.cardPerformance.map(normalizeCardPerformance);

  return {
    ...payload,
    source: payload.source.trim(),
    version: payload.version.trim(),
    snapshotDate: payload.snapshotDate.trim(),
    topArchetypes,
    archetypes,
    cardPerformance,
  };
}
