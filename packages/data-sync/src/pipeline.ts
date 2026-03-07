import type {
  MetaSourceAdapter,
  MetaSourcePayload,
  PipelineDryRunReport,
  PipelineValidationResult,
} from './types';
import { normalizeMetaPayload } from './normalize';
import { validateMetaPayload } from './validate';

export interface MetaPipelineResult {
  mergedPayload: MetaSourcePayload;
  sourcePayloads: MetaSourcePayload[];
  validation: PipelineValidationResult;
  dryRunReport: PipelineDryRunReport;
}

export interface MetaPipelineOptions {
  dryRun?: boolean;
}

function mergePayloads(payloads: MetaSourcePayload[]): MetaSourcePayload {
  if (payloads.length === 0) {
    throw new Error('Meta pipeline cannot merge zero payloads');
  }

  const sorted = [...payloads].sort((a, b) => b.snapshotDate.localeCompare(a.snapshotDate));
  const latest = sorted[0];

  const archetypesById = new Map<string, MetaSourcePayload['archetypes'][number]>();
  const cardPerfByKey = new Map<string, MetaSourcePayload['cardPerformance'][number]>();

  for (const payload of sorted) {
    for (const archetype of payload.archetypes) {
      if (!archetypesById.has(archetype.archetypeId)) {
        archetypesById.set(archetype.archetypeId, archetype);
      }
    }
    for (const card of payload.cardPerformance) {
      const key = `${card.cardId}::${card.archetypeId}`;
      if (!cardPerfByKey.has(key)) {
        cardPerfByKey.set(key, card);
      }
    }
  }

  return {
    source: payloads.map((p) => p.source).join('+'),
    version: latest.version,
    snapshotDate: latest.snapshotDate,
    topArchetypes: latest.topArchetypes,
    archetypes: [...archetypesById.values()].sort((a, b) => a.rank - b.rank),
    cardPerformance: [...cardPerfByKey.values()],
    notes: latest.notes,
  };
}

export async function runMetaPipeline(
  adapters: MetaSourceAdapter[],
  options: MetaPipelineOptions = {},
): Promise<MetaPipelineResult> {
  const payloads = await Promise.all(adapters.map((adapter) => adapter.fetch()));
  const normalized = payloads.map(normalizeMetaPayload);
  const mergedPayload = normalizeMetaPayload(mergePayloads(normalized));
  const validation = validateMetaPayload(mergedPayload);
  const dryRunReport: PipelineDryRunReport = {
    enabled: options.dryRun === true,
    sources: normalized.map((payload: MetaSourcePayload) => payload.source),
    snapshotDate: mergedPayload.snapshotDate,
    archetypeCount: mergedPayload.archetypes.length,
    cardPerformanceCount: mergedPayload.cardPerformance.length,
  };

  return {
    mergedPayload,
    sourcePayloads: normalized,
    validation,
    dryRunReport,
  };
}
