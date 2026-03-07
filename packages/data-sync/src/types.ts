export type TrendDirection = 'up' | 'flat' | 'down';

export interface MetaSourceArchetype {
  archetypeId: string;
  rank: number;
  winRate?: number;
  playRate?: number;
  weightedScore?: number;
  trendDirection?: TrendDirection;
}

export interface MetaSourceCardPerformance {
  cardId: string;
  archetypeId: string;
  inclusionRate?: number;
  winImpact?: number;
  sampleSize?: number;
}

export interface MetaSourcePayload {
  source: string;
  version: string;
  snapshotDate: string;
  topArchetypes: string[];
  archetypes: MetaSourceArchetype[];
  cardPerformance: MetaSourceCardPerformance[];
  notes?: string;
}

export interface MetaSourceAdapter {
  id: string;
  fetch(): Promise<MetaSourcePayload>;
}

export interface PipelineValidationResult {
  ok: boolean;
  errors: string[];
}

export interface PipelineDryRunReport {
  enabled: boolean;
  sources: string[];
  snapshotDate: string;
  archetypeCount: number;
  cardPerformanceCount: number;
}
