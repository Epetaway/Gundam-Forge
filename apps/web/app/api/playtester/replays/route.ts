import {
  PlaytesterReplayPostRequestSchema,
  PlaytesterReplayPostResponseSchema,
} from '@gundam-forge/shared';
import {
  apiOk,
  enforceContract,
  parseRequestContract,
  toApiErrorResponse,
} from '@/lib/api/server';
import { saveReplay } from '@/lib/playtester/replay-repository';

export const dynamic = process.env.NEXT_OUTPUT_MODE === 'export' ? 'force-static' : 'force-dynamic';

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json();
    const payload = parseRequestContract(
      PlaytesterReplayPostRequestSchema,
      body,
      '/api/playtester/replays',
    );

    await saveReplay(payload.replay);

    const response = enforceContract(
      PlaytesterReplayPostResponseSchema,
      {
        accepted: true,
        replayVersion: payload.replay.replayVersion,
        gameId: payload.replay.gameId,
      },
      '/api/playtester/replays',
    );

    return apiOk(response, request, { status: 201 });
  } catch (error) {
    return toApiErrorResponse('/api/playtester/replays', error, request);
  }
}
