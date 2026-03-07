'use client';

import * as React from 'react';
import { Container } from '@/components/layout/Container';
import { DeckBuilderPage } from '@/app/forge/forge-workbench';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { MetaArchetypesSidebar } from '@/components/deck/MetaArchetypesSidebar';

export default function ForgePage(): JSX.Element {
  const [deckId, setDeckId] = React.useState<string | null>(null);
  const [initialSetId, setInitialSetId] = React.useState<string | undefined>(undefined);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('deckId');
    const sid = params.get('setId');
    if (id) setDeckId(id);
    if (sid) setInitialSetId(sid);
  }, []);

  return (
    <ErrorBoundary context="Forge">
      <Container className="py-0 px-0" wide>
        <div className="relative">
          <DeckBuilderPage deckId={deckId} initialDeck={null} initialSetId={initialSetId} />
          <div className="pointer-events-none absolute right-3 top-3 hidden xl:block">
            <div className="pointer-events-auto">
              <MetaArchetypesSidebar />
            </div>
          </div>
        </div>
      </Container>
    </ErrorBoundary>
  );
}
