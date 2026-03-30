import { apiOk, toApiErrorResponse } from '@/lib/api/server';
import { getDecks } from '@/lib/data/decks';
import { validateDeck } from '@gundam-forge/shared';
import { cards } from '@/lib/data/cards';

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
    const q = toLower(searchParams.get('q'));
    const color = toLower(searchParams.get('color'));
    const archetype = toLower(searchParams.get('archetype'));

    const decks = getDecks()
      .filter((deck) => {
        const matchesQuery =
          q.length === 0 ||
          `${deck.name} ${deck.description} ${deck.owner}`.toLowerCase().includes(q);
        const matchesColor =
          color.length === 0 ||
          deck.colors.some((deckColor) => deckColor.toLowerCase() === color);
        const matchesArchetype =
          archetype.length === 0 || deck.archetype.toLowerCase() === archetype;

        // Filter out invalid decks
        const validation = validateDeck(deck.entries, cards);
        const isValid = validation.isValid;

        return matchesQuery && matchesColor && matchesArchetype && isValid;
      })
      .sort((a, b) => b.likes + b.views - (a.likes + a.views));

    return apiOk({ decks }, request);
  } catch (error) {
    return toApiErrorResponse('/api/decks', error, request);
  }
}
