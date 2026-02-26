'use client';

import * as React from 'react';
import { CardSearchPanel } from './CardSearchPanel';
import { DeckPanel } from './DeckPanel';
import { useDeckBuilder } from './useDeckBuilder';
import { canUseSupabase } from '@/lib/supabase/client';

/**
 * ForgeWorkbench — full-height two-panel Forge layout.
 *
 * Left  (w-80, fixed): search-first card browser.
 *   → Default: empty prompt, no network requests.
 *   → On query/filter: fetches /api/cards/search (paginated, minimal fields).
 *   → "Load more" accumulates results; CSS content-visibility skips off-screen paint.
 *
 * Right (flex-1): deck builder panel.
 *   → Grouped by card type (Unit → Pilot → Command → Base → Resource).
 *   → Real-time validation banner (errors + warnings).
 *   → Save CTA gated behind auth; guests build freely within the session.
 */
export function ForgeWorkbench(): JSX.Element {
  const builderState = useDeckBuilder();

  // Stable lookup so CardSearchPanel doesn't re-render on every deck keystroke
  const deckQty = React.useCallback(
    (cardId: string) => builderState.deck[cardId] ?? 0,
    [builderState.deck],
  );

  // Supabase config presence is used as a proxy for "auth is available".
  // Wire in a real session check (e.g. supabase.auth.getSession) when ready.
  const isAuthenticated = canUseSupabase() ?? false;

  const handleSave = React.useCallback(() => {
    // TODO: implement Supabase deck save when auth session is wired in
    alert('Deck saving requires a connected Supabase project. Sign in to enable.');
  }, []);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Left: Card Pool ───────────────────────────────── */}
      <aside
        aria-label="Card pool search"
        className="flex w-80 flex-shrink-0 flex-col overflow-hidden border-r border-border bg-surface"
      >
        <div className="flex-shrink-0 border-b border-border px-3 py-2">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-steel-500">
            Card Pool
          </h2>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <CardSearchPanel deckQty={deckQty} onAddCard={builderState.addCard} />
        </div>
      </aside>

      {/* ── Right: Deck ───────────────────────────────────── */}
      <main
        aria-label="Deck builder"
        className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface"
      >
        <div className="flex-shrink-0 border-b border-border px-3 py-2">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-steel-500">
            Deck
          </h2>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <DeckPanel
            isAuthenticated={isAuthenticated}
            onSave={handleSave}
            state={builderState}
          />
        </div>
      </main>
    </div>
  );
}
