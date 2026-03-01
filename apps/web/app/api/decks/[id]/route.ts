import { NextResponse } from 'next/server';
import { getDecks } from '@/lib/data/decks';
import type { GameEngine } from '@/lib/game/game-engine';

export const dynamic = 'force-static';
export const revalidate = false;

interface DeckDefinition {
  id: string;
  name: string;
  description?: string;
  cards: {
    cardId: string;
    count: number;
    zone: 'main' | 'resource' | 'base' | 'exResource' | 'exBase';
  }[];
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const deckId = params.id;
    const decks = getDecks();
    const deckRecord = decks.find((d) => d.id === deckId);

    if (!deckRecord) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 }
      );
    }

    // Transform DeckRecord to DeckDefinition for GameEngine
    const deckDefinition: DeckDefinition = {
      id: deckRecord.id,
      name: deckRecord.name,
      description: deckRecord.description,
      cards: deckRecord.entries.map((entry) => ({
        cardId: entry.cardId,
        count: entry.qty,
        zone: 'main' as const,
      })),
    };

    return NextResponse.json({ deck: deckDefinition });
  } catch (error) {
    console.error(`Error fetching deck:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
