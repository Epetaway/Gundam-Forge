'use client';

import Link from 'next/link';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Layers, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DeckPreviewCard } from '@/components/deck/DeckPreviewCard';
import type { DeckRecord } from '@/lib/data/decks';
import { getCard, getCardImage } from '@/lib/data/cards';
import { withBasePath } from '@/lib/utils/basePath';
import { getEvents } from '@/lib/data/events';
import { rankTrendingDecks } from '@/lib/meta/engine';
import { useDecksQuery } from '@/lib/query/useDecksQuery';
import { relativeTime } from '@/lib/utils/relativeTime';

interface ExploreClientProps {
  initialDecks: DeckRecord[];
}

type ExploreSort = 'trending' | 'winRate' | 'mostViewed';

export default function ExploreClient({ initialDecks }: ExploreClientProps): JSX.Element {
  const router = useRouter();
  const [sort, setSort] = React.useState<ExploreSort>('trending');
  const events = React.useMemo(() => getEvents(), []);
  const { data: decks = initialDecks, isFetching } = useDecksQuery({ initialData: initialDecks });

  const enriched = React.useMemo(() => rankTrendingDecks(decks, events, 50), [decks, events]);

  const visibleDecks = React.useMemo(() => {
    if (sort === 'trending') return enriched;
    if (sort === 'winRate') return [...enriched].sort((a, b) => b.winRate - a.winRate);
    return [...enriched].sort((a, b) => b.views - a.views);
  }, [enriched, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Sort decks by" className="flex flex-wrap gap-2">
          <Button onClick={() => setSort('trending')} size="sm" variant={sort === 'trending' ? 'primary' : 'secondary'} aria-pressed={sort === 'trending'}>
            Trending
          </Button>
          <Button onClick={() => setSort('winRate')} size="sm" variant={sort === 'winRate' ? 'primary' : 'secondary'} aria-pressed={sort === 'winRate'}>
            Win Rate
          </Button>
          <Button onClick={() => setSort('mostViewed')} size="sm" variant={sort === 'mostViewed' ? 'primary' : 'secondary'} aria-pressed={sort === 'mostViewed'}>
            Most Viewed
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-steel-600" aria-live="polite" aria-atomic="true">
          {isFetching && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
          {isFetching ? 'Refreshing…' : `${visibleDecks.length} decks`}
        </div>
        <Link href="/decks/new" className="ml-4">
          <Button size="sm" variant="primary">+ Create Deck</Button>
        </Link>
      </div>

      {visibleDecks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface-muted/50 py-16 text-center" role="status">
          <Layers className="mx-auto mb-3 h-8 w-8 text-steel-600" aria-hidden="true" />
          <p className="font-mono text-xs uppercase tracking-widest text-steel-500 mb-3">No decks found</p>
          <p className="text-sm text-steel-600 mb-6">
            {isFetching ? 'Loading decks…' : 'No competitive decks match your filters. Try a different sort or create one yourself!'}
          </p>
          <Link href="/decks/new">
            <Button size="sm" variant="primary">+ Create Deck</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {visibleDecks.map((deck) => {
            const previewCard = getCard(deck.entries[0]?.cardId);
            return (
              <DeckPreviewCard
                key={deck.id}
                heroUrl={previewCard ? getCardImage(previewCard) : withBasePath('/hero-bg.png')}
                title={deck.name}
                subtitle={deck.owner || 'Unknown Pilot'}
                author={deck.owner || 'Unknown'}
                views={deck.views || 0}
                cardCount={deck.entries.reduce((sum, e) => sum + (e.qty || 0), 0)}
                updatedAgo={relativeTime(deck.updatedAt ?? deck.id)}
                colors={deck.colors || []}
                archetype={deck.archetype}
                tags={deck.archetype ? [deck.archetype] : []}
                avatarUrl={undefined}
                onClick={() => router.push(`/decks/${deck.id}`)}
                onMenu={() => {}}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
