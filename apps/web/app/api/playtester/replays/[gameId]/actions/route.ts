import {
  PlaytesterActionLogsQuerySchema,
  PlaytesterActionLogsResponseSchema,
} from '@gundam-forge/shared';
import { apiError, apiOk, enforceContract, parseRequestContract, toApiErrorResponse } from '@/lib/api/server';
import { getReplay, listReplayActions } from '@/lib/playtester/replay-repository';

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

    const searchParams = new URL(request.url).searchParams;
    const query = parseRequestContract(
      PlaytesterActionLogsQuerySchema,
      {
        category: searchParams.get('category') ?? undefined,
        playerId: searchParams.get('playerId') ?? undefined,
        limit: searchParams.get('limit') ?? undefined,
        cursor: searchParams.get('cursor') ?? undefined,
      },
      '/api/playtester/replays/[gameId]/actions',
    );

    const result = await listReplayActions(params.gameId, {
      category: query.category,
      playerId: query.playerId,
      limit: query.limit,
      cursor: query.cursor,
    });

    const response = enforceContract(
      PlaytesterActionLogsResponseSchema,
      {
        actions: result.actions,
        nextCursor: result.nextCursor,
        total: result.total,
        limit: query.limit,
      },
      '/api/playtester/replays/[gameId]/actions',
    );

    return apiOk(response, request, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return toApiErrorResponse('/api/playtester/replays/[gameId]/actions', error, request);
  }
}
