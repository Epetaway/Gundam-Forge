'use client';

import * as React from 'react';
import { DeckBuilderPage } from '@/app/forge/forge-workbench';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

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
      <div className="h-[calc(100vh-4rem)]">
        <DeckBuilderPage deckId={deckId} initialDeck={null} initialSetId={initialSetId} />
      </div>
    </ErrorBoundary>
  );
}
