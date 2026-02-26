import { NextResponse } from 'next/server';
import { getDecks } from '@/lib/data/decks';

function toLower(value: string | null): string {
  return (value ?? '').trim().toLowerCase();
}

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
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

      return matchesQuery && matchesColor && matchesArchetype;
    })
    .sort((a, b) => b.likes + b.views - (a.likes + a.views));

  return NextResponse.json({ decks });
}
