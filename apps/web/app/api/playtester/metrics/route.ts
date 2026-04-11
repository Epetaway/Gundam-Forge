import {
  PlaytesterMetricsPostRequestSchema,
  PlaytesterMetricsPostResponseSchema,
} from '@gundam-forge/shared';
import {
  apiOk,
  enforceContract,
  parseRequestContract,
  toApiErrorResponse,
} from '@/lib/api/server';
import { savePostGameMetrics } from '@/lib/playtester/replay-repository';

export const dynamic = process.env.NEXT_OUTPUT_MODE === 'export' ? 'force-static' : 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const payload = parseRequestContract(
      PlaytesterMetricsPostRequestSchema,
      body,
      '/api/playtester/metrics',
    );

    await savePostGameMetrics(payload.gameId, payload.deckId, payload.metrics);

    const response = enforceContract(
      PlaytesterMetricsPostResponseSchema,
      {
        accepted: true,
        replayVersion: '1.0',
      },
      '/api/playtester/metrics',
    );

    return apiOk(response, request, { status: 202 });
  } catch (error) {
    return toApiErrorResponse('/api/playtester/metrics', error, request);
  }
}
