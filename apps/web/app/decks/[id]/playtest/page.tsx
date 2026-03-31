import { deckCatalog, getDeckById } from '@/lib/data/decks';
import { cardsRecord } from '@/lib/data/cards';
import { notFound } from 'next/navigation';
import { PlaytestGameEnhanced } from '@/components/playtest/PlaytestGameEnhanced';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

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
  const deck = getDeckById(params.id);
  if (!deck) {
    notFound();
  }

  return (
    <ErrorBoundary context="Playtester">
      <PlaytestGameEnhanced
        playerDeck={deck}
        opponentDeckId="token-colorless-bot"
        cardDatabase={cardsRecord}
      />
    </ErrorBoundary>
  );
}
