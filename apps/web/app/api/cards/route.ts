import { CardsApiResponseSchema, CardsQuerySchema } from '@gundam-forge/shared';
import { apiOk, enforceContract, parseRequestContract, toApiErrorResponse } from '@/lib/api/server';
import { getCardList } from '@/lib/data/cards';
import { filtersFromSearchParams } from '@/lib/filters/cardFilters';

export const dynamic = 'force-static';
export const revalidate = false;

function parseQueryParams(searchParams: URLSearchParams) {
  const filters = filtersFromSearchParams(searchParams);

  const parsedQuery = parseRequestContract(
    CardsQuerySchema,
    {
    q: searchParams.get('q') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    cursor: searchParams.get('cursor') ?? undefined,
    excludeTypes: searchParams.get('excludeTypes') ?? undefined,
    },
    '/api/cards',
  );

  const q = parsedQuery.q;
  const limit = parsedQuery.limit;
  const cursor = parsedQuery.cursor;
  const excludeTypes = parsedQuery.excludeTypes ?? [];

  return { q, limit, cursor, excludeTypes, filters };
}

export async function GET(request: Request): Promise<Response> {
  try {
    const searchParams = new URL(request.url).searchParams;
    const { q, limit, cursor, excludeTypes, filters } = parseQueryParams(searchParams);
    const { results, nextCursor, total } = getCardList({ q, limit, cursor, excludeTypes, ...filters });

    const response = enforceContract(
      CardsApiResponseSchema,
      {
        cards: results,
        nextCursor,
        total,
        limit,
        appliedFilters: filters,
      },
      '/api/cards',
    );

    return apiOk(response, request);
  } catch (error) {
    return toApiErrorResponse('/api/cards', error, request);
  }
}
