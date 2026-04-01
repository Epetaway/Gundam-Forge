'use client';

import * as React from 'react';
import Link from 'next/link';
import { DeckBuilderPage } from '@/app/forge/forge-workbench';
import { DeckSetupProvider } from '@/components/deck/DeckSetupContext';
import DeckSetupForm from '@/components/deck/DeckSetupForm';
import DeckPreviewPanel from '@/components/deck/DeckPreviewPanel';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { cn } from '@/lib/utils/cn';
import { cards } from '@/lib/data/cards';

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

  if (!deckId) {
    return (
      <DeckSetupProvider>
        <CreateDeckWorkspace />
      </DeckSetupProvider>
    );
  }

  return (
    <ErrorBoundary context="Forge">
      <div className="h-[calc(100vh-4rem)]">
        <DeckBuilderPage deckId={deckId} initialDeck={null} initialSetId={initialSetId} />
      </div>
    </ErrorBoundary>
  );
}

function CreateDeckWorkspace(): JSX.Element {
  const [showPreview, setShowPreview] = React.useState(false);

  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 bg-background xl:grid-cols-[420px_minmax(0,1fr)]">
      <aside className="border-r border-cobalt-900/60 bg-gradient-to-b from-surface via-surface to-surface-muted px-4 py-5 md:px-5 xl:sticky xl:top-16 xl:h-[calc(100vh-4rem)] xl:overflow-y-auto xl:scrollbar-modern">
        <div className="space-y-4">
          <div>
            <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-cobalt-300">Forge</p>
            <h1 className="font-display text-3xl font-semibold uppercase tracking-wide text-foreground">Create New Deck</h1>
            <p className="mt-1 text-xs text-steel-600">Use icon tabs and drawers to move fast without long scrolling.</p>
          </div>

          <DeckSetupForm cards={cards} />

          <div className="flex flex-col gap-2 border-t border-cobalt-900/55 pt-3.5">
            <Button
              onClick={() => setShowPreview((open) => !open)}
              size="sm"
              variant="secondary"
              className="mb-2 md:hidden"
            >
              {showPreview ? 'Hide preview' : 'Preview deck'}
            </Button>
            <Link
              className="text-sm text-cobalt-300 hover:text-cobalt-200 hover:underline"
              href="/decks"
            >
              Browse existing decks
            </Link>
            <Link
              className="text-sm text-steel-600 hover:text-foreground hover:underline"
              href="/"
            >
              Cancel
            </Link>
          </div>
        </div>
      </aside>

      <section
        className={cn(
          'hidden bg-background px-6 py-6 md:flex md:items-center md:justify-center lg:px-10 lg:py-8',
          showPreview && 'block',
        )}
      >
        <div className="w-full max-w-[340px] space-y-4">
          <DeckPreviewPanel />
          <p className="text-xs text-steel-600">
            Decks are browser-local for now. Clearing site data removes saved local decks.
          </p>
        </div>
      </section>
    </div>
  );
}
