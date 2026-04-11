import { PlaytesterReplayGetResponseSchema } from '@gundam-forge/shared';
import { apiError, apiOk, enforceContract, toApiErrorResponse } from '@/lib/api/server';
import { getReplay } from '@/lib/playtester/replay-repository';

export const dynamic = process.env.NEXT_OUTPUT_MODE === 'export' ? 'force-static' : 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { gameId: string } },
): Promise<Response> {
  try {
    const replay = await getReplay(params.gameId);
    if (!replay) {
      return apiError('Replay not found', 404, request, { code: 'REPLAY_NOT_FOUND' });
    }

    const response = enforceContract(
      PlaytesterReplayGetResponseSchema,
      { replay },
      '/api/playtester/replays/[gameId]',
    );

    return apiOk(response, request, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return toApiErrorResponse('/api/playtester/replays/[gameId]', error, request);
  }
}
