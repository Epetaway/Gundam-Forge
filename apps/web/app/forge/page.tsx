'use client';

import * as React from 'react';
import { Container } from '@/components/layout/Container';
import { DeckBuilderPage } from '@/app/forge/forge-workbench';

export default function ForgePage(): JSX.Element {
  const [deckId, setDeckId] = React.useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('deckId');
    if (id) setDeckId(id);
  }, []);

  return (
    <Container className="py-0 px-0" wide>
      <DeckBuilderPage deckId={deckId} initialDeck={null} />
    </Container>
  );
}
