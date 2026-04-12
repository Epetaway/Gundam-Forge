import { z } from 'zod';
import type { MetaSourcePayload, PipelineValidationResult } from './types';

// ── Zod Schemas for runtime validation ────────────────────────────────────

/** Trend direction for archetype performance */
const TrendDirectionSchema = z.enum(['up', 'flat', 'down']);

/** ISO 8601 date format: YYYY-MM-DD */
const IsoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format');

/** Archetype performance metrics */
export const MetaSourceArchetypeSchema = z.object({
  archetypeId: z.string().min(1, 'archetypeId is required'),
  rank: z.number().positive('rank must be positive'),
  winRate: z.number().min(0).max(100).optional(),
  playRate: z.number().min(0).max(100).optional(),
  weightedScore: z.number().optional(),
  trendDirection: TrendDirectionSchema.optional(),
});

/** Card performance in archetype */
export const MetaSourceCardPerformanceSchema = z.object({
  cardId: z.string().min(1, 'cardId is required'),
  archetypeId: z.string().min(1, 'archetypeId is required'),
  inclusionRate: z.number().min(0).max(1).optional(),
  winImpact: z.number().optional(),
  sampleSize: z.number().int().positive().optional(),
});

/** Meta data source payload */
export const MetaSourcePayloadSchema = z.object({
  source: z.string().min(1, 'source is required'),
  version: z.string().min(1, 'version is required'),
  snapshotDate: IsoDateSchema,
  topArchetypes: z.array(z.string()),
  archetypes: z.array(MetaSourceArchetypeSchema),
  cardPerformance: z.array(MetaSourceCardPerformanceSchema),
  notes: z.string().optional(),
});

// ── Validation function using Zod ────────────────────────────────────────

/**
 * Validate meta source payload using Zod schema.
 * Returns structured validation result with Zod error details.
 */
export function validateMetaPayload(payload: MetaSourcePayload): PipelineValidationResult {
  const result = MetaSourcePayloadSchema.safeParse(payload);

  if (result.success) {
    return {
      ok: true,
      errors: [],
    };
  }

  // Format Zod errors for clarity
  const errors = result.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
    return `${path}${issue.message}`;
  });

  return {
    ok: false,
    errors,
  };
}

