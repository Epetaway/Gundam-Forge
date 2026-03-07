import { EventsLiveAdapter, runMetaPipeline } from '@gundam-forge/data-sync';
import { apiOk, toApiErrorResponse } from '@/lib/api/server';

export async function GET() {
  try {
    const result = await runMetaPipeline([new EventsLiveAdapter()], { dryRun: true });

    return apiOk({
      ok: result.validation.ok,
      snapshotDate: result.mergedPayload.snapshotDate,
      topArchetypes: result.mergedPayload.archetypes.slice(0, 8),
      validationErrors: result.validation.errors,
    });
  } catch (error) {
    return toApiErrorResponse('/api/meta/trends', error);
  }
}
