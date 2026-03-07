import type { MetaSourcePayload, PipelineValidationResult } from './types';

function isIsoDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

export function validateMetaPayload(payload: MetaSourcePayload): PipelineValidationResult {
  const errors: string[] = [];

  if (!payload.source) errors.push('source is required');
  if (!payload.version) errors.push('version is required');
  if (!payload.snapshotDate || !isIsoDate(payload.snapshotDate)) {
    errors.push('snapshotDate must be YYYY-MM-DD');
  }

  for (const entry of payload.archetypes) {
    if (!entry.archetypeId) errors.push('archetype entry missing archetypeId');
    if (!Number.isFinite(entry.rank) || entry.rank <= 0) {
      errors.push(`archetype ${entry.archetypeId || '<unknown>'} has invalid rank`);
    }
  }

  for (const card of payload.cardPerformance) {
    if (!card.cardId) errors.push('cardPerformance entry missing cardId');
    if (!card.archetypeId) errors.push(`cardPerformance ${card.cardId || '<unknown>'} missing archetypeId`);
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}
