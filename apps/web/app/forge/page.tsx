'use client';

import * as React from 'react';
import { Container } from '@/components/layout/Container';
import { DeckBuilderPage } from '@/app/forge/forge-workbench';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { MetaArchetypesSidebar } from '@/components/deck/MetaArchetypesSidebar';

export default function ForgePage(): JSX.Element {
  const [deckId, setDeckId] = React.useState<string | null>(null);
  const [initialSetId, setInitialSetId] = React.useState<string | undefined>(undefined);
  const [mobileMetaOpen, setMobileMetaOpen] = React.useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('deckId');
    const sid = params.get('setId');
    if (id) setDeckId(id);
    if (sid) setInitialSetId(sid);
  }, []);

  React.useEffect(() => {
    if (!mobileMetaOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileMetaOpen(false);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMetaOpen]);

  return (
    <ErrorBoundary context="Forge">
      <Container className="py-0 px-0" wide>
        <div className="relative">
          <DeckBuilderPage deckId={deckId} initialDeck={null} initialSetId={initialSetId} />

          <button
            type="button"
            className="fixed bottom-4 right-4 z-40 rounded-full bg-cobalt-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-cobalt-500 xl:hidden"
            onClick={() => setMobileMetaOpen(true)}
            aria-label="Open live meta panel"
          >
            Meta
          </button>

          {mobileMetaOpen && (
            <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label="Live meta archetypes panel">
              <div className="absolute inset-0 bg-black/55" onClick={() => setMobileMetaOpen(false)} aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 rounded-t-xl border border-steel-700 bg-surface-950 p-3 pb-5">
                <div className="mb-2 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-surface-foreground">Live Meta</h2>
                  <button
                    type="button"
                    className="min-h-11 rounded border border-steel-700 px-3 text-xs text-surface-foreground"
                    onClick={() => setMobileMetaOpen(false)}
                    aria-label="Close live meta panel"
                  >
                    Close
                  </button>
                </div>
                <MetaArchetypesSidebar />
              </div>
            </div>
          )}

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
