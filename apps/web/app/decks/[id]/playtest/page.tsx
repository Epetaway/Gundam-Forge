import { deckCatalog, getDeckById } from '@/lib/data/decks';
import { cardsRecord } from '@/lib/data/cards';
import { notFound } from 'next/navigation';
import { PlaytestGameEnhanced } from '@/components/playtest/PlaytestGameEnhanced';

// Playtest is a runtime-only feature — not statically generated in production
export const dynamic = 'force-dynamic';

// Only generate playtest pages in development — hidden in production builds
export function generateStaticParams() {
  if (process.env.NODE_ENV === 'production') return [];
  return deckCatalog.map((deck) => ({ id: deck.id }));
}

interface PlaytestPageProps {
  params: {
    id: string;
  };
}

export default function PlaytestPage({ params }: PlaytestPageProps) {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  const deck = getDeckById(params.id);
  if (!deck) {
    notFound();
  }

  return (
    <PlaytestGameEnhanced
      playerDeck={deck}
      opponentDeckId="ai-deck-default"
      cardDatabase={cardsRecord}
    />
  );
}
