import { deckCatalog, getDeckById } from '@/lib/data/decks';
import { cardsRecord } from '@/lib/data/cards';
import { notFound } from 'next/navigation';
import { PlaytestGameEnhanced } from '@/components/playtest/PlaytestGameEnhanced';

// Always generate static params so Next.js export doesn't reject the dynamic route.
// The page body calls notFound() in production to keep the route inaccessible.
export function generateStaticParams() {
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
