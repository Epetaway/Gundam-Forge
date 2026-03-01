import { deckCatalog, getDeckById } from '@/lib/data/decks';
import { cardsById } from '@/lib/data/cards';
import { notFound } from 'next/navigation';
import { PlaytestGameEnhanced } from '@/components/playtest/PlaytestGameEnhanced';

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
    <PlaytestGameEnhanced
      playerDeckId={params.id}
      opponentDeckId="ai-deck-default"
      cardDatabase={cardsById}
      onGameEnd={(winner, reason) => {
        console.log(`Game ended: ${winner} wins - ${reason}`);
      }}
    />
  );
}
