// Required for static export: generateStaticParams
import { deckCatalog } from '@/lib/data/decks';
import { notFound } from 'next/navigation';
import { DeckViewPage } from '@/components/deck/DeckViewPage';
import { getDeckById, getResolvedEntries } from '@/lib/data/decks';
import { toDeckViewItem } from '@/lib/deck/sortFilter';

export function generateStaticParams() {
  return deckCatalog.map(deck => ({ id: deck.id }));
}

interface DeckViewPageProps {
  params: {
    id: string;
  };
}

export default function DeckViewRoute({ params }: DeckViewPageProps): JSX.Element {
  const foundDeck = getDeckById(params.id);
  if (!foundDeck) notFound();
  const deck = foundDeck;

  const initialItems = getResolvedEntries(deck)
    .map((entry) => toDeckViewItem(entry))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return (
    <DeckViewPage
      deck={{
        id: deck.id,
        name: deck.name,
        description: deck.description,
        archetype: deck.archetype,
        owner: deck.owner,
        colors: deck.colors,
      }}
      initialItems={initialItems}
    />
  );
}
