import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  runMetaPipeline,
  EventsLiveAdapter,
  validateMetaPayload,
  type MetaSourcePayload,
} from '@gundam-forge/data-sync';
import { apiError, apiOk, HttpError, toApiErrorResponse } from '@/lib/api/server';

const metaPayloadSchema = z.object({
  source: z.string().min(1),
  version: z.string().min(1),
  snapshotDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  topArchetypes: z.array(z.string()),
  archetypes: z.array(
    z.object({
      archetypeId: z.string().min(1),
      rank: z.number().int().positive(),
      winRate: z.number().min(0).max(1).optional(),
      playRate: z.number().min(0).max(1).optional(),
      weightedScore: z.number().optional(),
      trendDirection: z.enum(['up', 'flat', 'down']).optional(),
    }),
  ),
  cardPerformance: z.array(
    z.object({
      cardId: z.string().min(1),
      archetypeId: z.string().min(1),
      inclusionRate: z.number().min(0).max(1).optional(),
      winImpact: z.number().optional(),
      sampleSize: z.number().int().nonnegative().optional(),
    }),
  ),
  notes: z.string().optional(),
});

function isAuthorized(req: NextRequest): boolean {
  const required = process.env.META_ADMIN_TOKEN;
  if (!required) return true;
  const supplied = req.headers.get('x-meta-admin-token');
  return supplied === required;
}

export async function GET() {
  try {
    const result = await runMetaPipeline([new EventsLiveAdapter()], { dryRun: true });
    return apiOk({
      ok: result.validation.ok,
      dryRunReport: result.dryRunReport,
      validationErrors: result.validation.errors,
      sample: result.mergedPayload,
    });
  } catch (error) {
    return toApiErrorResponse('/api/admin/meta', error);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAuthorized(req)) {
      return apiError('Unauthorized', 401, req, { code: 'UNAUTHORIZED' });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      throw new HttpError('Invalid JSON body', 400, { code: 'INVALID_JSON' });
    }

    if (body.payload) {
      const parsed = metaPayloadSchema.safeParse(body.payload);
      if (!parsed.success) {
        throw new HttpError('Payload validation failed', 400, {
          code: 'PAYLOAD_VALIDATION_FAILED',
          details: parsed.error.flatten(),
        });
      }

      const payload = parsed.data as MetaSourcePayload;
      const validation = validateMetaPayload(payload);
      if (!validation.ok) {
        throw new HttpError('Pipeline validation failed', 400, {
          code: 'PIPELINE_VALIDATION_FAILED',
          details: validation.errors,
        });
      }

      return apiOk(
        {
          mode: 'manual-payload',
          ingested: {
            source: payload.source,
            snapshotDate: payload.snapshotDate,
            archetypes: payload.archetypes.length,
            cardPerformance: payload.cardPerformance.length,
          },
          note: 'Database persistence endpoint wiring is ready; write step is handled by phase 16.3 service integration.',
        },
        req,
      );
    }

    const result = await runMetaPipeline([new EventsLiveAdapter()], { dryRun: body.dryRun !== false });

    return apiOk(
      {
        ok: result.validation.ok,
        mode: 'auto-detect',
        dryRunReport: result.dryRunReport,
        validationErrors: result.validation.errors,
        mergedPayload: result.mergedPayload,
      },
      req,
    );
  } catch (error) {
    return toApiErrorResponse('/api/admin/meta', error, req);
  }
}
