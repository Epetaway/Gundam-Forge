'use client';

import Link from 'next/link';
import { Layers, Loader2 } from 'lucide-react';
import type { DeckRecord } from '@/lib/data/decks';
import { useDecksQuery } from '@/lib/query/useDecksQuery';
import { Button } from '@/components/ui/Button';
import { DeckPreviewCard } from '@/components/deck/DeckPreviewCard';
import { getCard, getCardImage } from '@/lib/data/cards';
import { withBasePath } from '@/lib/utils/basePath';
import { relativeTime } from '@/lib/utils/relativeTime';

interface DecksClientProps {
  initialDecks: DeckRecord[];
}

export default function DecksClient({ initialDecks }: DecksClientProps): JSX.Element {
  const { data: decks = initialDecks, isFetching } = useDecksQuery({ initialData: initialDecks });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 text-xs text-steel-600" aria-live="polite" aria-atomic="true">
        {isFetching && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
        {isFetching ? 'Refreshing decks…' : `${decks.length} decks loaded`}
      </div>

      {decks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-muted/50 py-16 text-center" role="status">
          <Layers className="mx-auto mb-3 h-8 w-8 text-steel-600" aria-hidden="true" />
          <p className="font-mono text-xs uppercase tracking-widest text-steel-500 mb-3">Deck library empty</p>
          <p className="text-sm text-steel-600 mb-6">
            {isFetching ? 'Loading decks…' : 'No decks have been added to the library yet. Start by creating your first deck!'}
          </p>
          <Link href="/decks/new">
            <Button variant="primary">+ Create Deck</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {decks.map((deck) => {
            const previewCard = getCard(deck.entries[0]?.cardId);
            return (
              <DeckPreviewCard
                key={deck.id}
                heroUrl={previewCard ? getCardImage(previewCard) : withBasePath('/hero-bg.png')}
                title={deck.name}
                subtitle={deck.description || ''}
                author={deck.owner || 'Unknown'}
                views={deck.views || 0}
                cardCount={deck.entries.reduce((sum, e) => sum + (e.qty || 0), 0)}
                updatedAgo={relativeTime(deck.updatedAt ?? deck.id)}
                colors={deck.colors || []}
                archetype={deck.archetype}
                tags={[
                  ...(deck.archetype ? [deck.archetype] : []),
                  ...(deck.source === 'tournament' ? ['Tournament'] : []),
                ]}
                href={`/decks/${deck.id}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
