import { DecksApiResponseSchema, DecksQuerySchema } from '@gundam-forge/shared';
import { apiOk, enforceContract, parseRequestContract, toApiErrorResponse } from '@/lib/api/server';
import { getDecks } from '@/lib/data/decks';
import { cards } from '@/lib/data/cards';
import { compareDecksDeterministically } from '@/lib/decks/deterministicSort';
import { validateDeck } from '@gundam-forge/shared';

export const dynamic = 'force-static';
export const revalidate = false;

function toLower(value: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

export async function GET(request: Request): Promise<Response> {
  try {
    const searchParams =
      process.env.NEXT_OUTPUT_MODE === 'export'
        ? new URLSearchParams()
        : new URL(request.url).searchParams;

    const parsedQuery = parseRequestContract(
      DecksQuerySchema,
      {
        q: searchParams.get('q') ?? undefined,
        color: searchParams.get('color') ?? undefined,
        archetype: searchParams.get('archetype') ?? undefined,
      },
      '/api/decks',
    );

    const q = toLower(parsedQuery.q ?? null);
    const color = toLower(parsedQuery.color ?? null);
    const archetype = toLower(parsedQuery.archetype ?? null);

    const decks = getDecks()
      .filter((deck) => {
        // Exclude invalid decks (not exactly 50 main-deck cards, >2 colors, etc.)
        const validation = validateDeck(deck.entries, cards);
        if (!validation.isValid) return false;

        const matchesQuery =
          q.length === 0 ||
          `${deck.name} ${deck.description} ${deck.owner}`.toLowerCase().includes(q);
        const matchesColor =
          color.length === 0 ||
          deck.colors.some((deckColor) => deckColor.toLowerCase() === color);
        const matchesArchetype =
          archetype.length === 0 || deck.archetype.toLowerCase() === archetype;

        return matchesQuery && matchesColor && matchesArchetype;
      })
      .sort(compareDecksDeterministically);

    const response = enforceContract(DecksApiResponseSchema, { decks }, '/api/decks');
    return apiOk(response, request);
  } catch (error) {
    return toApiErrorResponse('/api/decks', error, request);
  }
}
