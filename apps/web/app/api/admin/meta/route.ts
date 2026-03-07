import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  runMetaPipeline,
  EventsLiveAdapter,
  validateMetaPayload,
  type MetaSourcePayload,
} from '@gundam-forge/data-sync';

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
  const result = await runMetaPipeline([new EventsLiveAdapter()], { dryRun: true });
  return NextResponse.json({
    ok: result.validation.ok,
    dryRunReport: result.dryRunReport,
    validationErrors: result.validation.errors,
    sample: result.mergedPayload,
  });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  // Mode A: explicit payload ingestion
  if (body.payload) {
    const parsed = metaPayloadSchema.safeParse(body.payload);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Payload validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const payload = parsed.data as MetaSourcePayload;
    const validation = validateMetaPayload(payload);
    if (!validation.ok) {
      return NextResponse.json(
        { ok: false, error: 'Pipeline validation failed', details: validation.errors },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      mode: 'manual-payload',
      ingested: {
        source: payload.source,
        snapshotDate: payload.snapshotDate,
        archetypes: payload.archetypes.length,
        cardPerformance: payload.cardPerformance.length,
      },
      note: 'Database persistence endpoint wiring is ready; write step is handled by phase 16.3 service integration.',
    });
  }

  // Mode B: auto-detect ingestion from events-live source
  const result = await runMetaPipeline([new EventsLiveAdapter()], { dryRun: body.dryRun !== false });

  return NextResponse.json({
    ok: result.validation.ok,
    mode: 'auto-detect',
    dryRunReport: result.dryRunReport,
    validationErrors: result.validation.errors,
    mergedPayload: result.mergedPayload,
  });
}
