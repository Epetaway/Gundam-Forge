import { NextResponse } from 'next/server';
import { EventsLiveAdapter, runMetaPipeline } from '@gundam-forge/data-sync';

export async function GET() {
  const result = await runMetaPipeline([new EventsLiveAdapter()], { dryRun: true });

  return NextResponse.json({
    ok: result.validation.ok,
    snapshotDate: result.mergedPayload.snapshotDate,
    topArchetypes: result.mergedPayload.archetypes.slice(0, 8),
    validationErrors: result.validation.errors,
  });
}
