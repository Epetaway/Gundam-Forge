import { apiOk, toApiErrorResponse } from '@/lib/api/server';
import { getCardList } from '@/lib/data/cards';
import { filtersFromSearchParams } from '@/lib/filters/cardFilters';

export const dynamic = 'force-static';
export const revalidate = false;

function parseQueryParams(searchParams: URLSearchParams) {
  const filters = filtersFromSearchParams(searchParams);
  const q = searchParams.get('q') ?? undefined;
  const limit = parseInt(searchParams.get('limit') || '30', 10);
  const cursor = searchParams.get('cursor') || undefined;
  const excludeTypes = searchParams.get('excludeTypes')?.split(',') || [];
  return { q, limit, cursor, excludeTypes, filters };
}

export async function GET(request: Request): Promise<Response> {
  try {
    const searchParams =
      process.env.NEXT_OUTPUT_MODE === 'export'
        ? new URLSearchParams()
        : new URL(request.url).searchParams;
    const { q, limit, cursor, excludeTypes, filters } = parseQueryParams(searchParams);
    const { results, nextCursor, total } = getCardList({ q, limit, cursor, excludeTypes, ...filters });

    return apiOk(
      {
        cards: results,
        nextCursor,
        total,
        limit,
        appliedFilters: filters,
      },
      request,
    );
  } catch (error) {
    return toApiErrorResponse('/api/cards', error, request);
  }
}
