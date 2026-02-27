'use client';

import * as React from 'react';
import { Container } from '@/components/layout/Container';
import { DeckBuilderPage } from '@/app/forge/forge-workbench';
import { cards } from '@/lib/data/cards';

const forgeCards = cards.map((card) => ({
  id: card.id,
  name: card.name,
  color: card.color,
  type: card.type,
  cost: card.cost,
  set: card.set,
  text: card.text,
  imageUrl: card.imageUrl,
  placeholderArt: card.placeholderArt,
}));

export default function ForgePage(): JSX.Element {
  const [deckId, setDeckId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('deckId');
    if (id) setDeckId(id);
  }, []);

  return (
    <Container className="py-0 px-0" wide>
      <DeckBuilderPage cards={forgeCards} deckId={deckId} initialDeck={null} />
    </Container>
  );
}
