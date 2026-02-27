import { deckCatalog, getDeckById, getResolvedEntries } from '@/lib/data/decks';
import { cards } from '@/lib/data/cards';
import { notFound } from 'next/navigation';
import { Container } from '@/components/layout/Container';
import { DeckBuilderPage } from '@/app/forge/forge-workbench';

/** Pre-build pages for the 4 built-in decks. User-created decks are handled by /forge?deckId= */
export function generateStaticParams() {
  return deckCatalog.map((deck) => ({ id: deck.id }));
}

interface Props {
  params: { id: string };
}


export default function ForgeDeckPage({ params }: Props): JSX.Element {
  const deck = getDeckById(params.id);
  if (!deck) notFound();

  const resolvedEntries = getResolvedEntries(deck).map((e) => ({
    cardId: e.cardId,
    qty: e.qty,
  }));

  return (
    <Container className="py-0 px-0" wide>
      <DeckBuilderPage
        deckId={null}
        initialDeck={{
          id: deck.id,
          name: deck.name,
          description: deck.description,
          archetype: deck.archetype,
          owner: deck.owner,
          colors: deck.colors,
          entries: resolvedEntries,
        }}
      />
    </Container>
  );
}
