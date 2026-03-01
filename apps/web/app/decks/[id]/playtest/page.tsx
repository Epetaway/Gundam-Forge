import { deckCatalog, getDeckById } from '@/lib/data/decks';
import { notFound } from 'next/navigation';
import type { DeckDefinition } from '@/lib/game/game-engine';
import PlaytestClient from './PlaytestClient';

export function generateStaticParams() {
  return deckCatalog.map((deck) => ({ id: deck.id }));
}

interface PlaytestPageProps {
  params: {
    id: string;
  };
}

function toDeckDefinition(deckId: string): DeckDefinition | null {
  const deckRecord = getDeckById(deckId);
  if (!deckRecord) return null;

  return {
    id: deckRecord.id,
    name: deckRecord.name,
    description: deckRecord.description,
    cards: deckRecord.entries.map((entry) => ({
      cardId: entry.cardId,
      count: entry.qty,
      zone: 'main' as const,
    })),
  };
}

export default function PlaytestPage({ params }: PlaytestPageProps) {
  const deck = toDeckDefinition(params.id);
  if (!deck) {
    notFound();
  }

  return <PlaytestClient deckId={params.id} deck={deck} />;
}
