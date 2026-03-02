'use client';

import Link from 'next/link';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DeckPreviewCard } from '@/components/deck/DeckPreviewCard';
import type { DeckRecord } from '@/lib/data/decks';
import { getCard, getCardImage } from '@/lib/data/cards';
import { withBasePath } from '@/lib/utils/basePath';
import { getEvents } from '@/lib/data/events';
import { rankTrendingDecks } from '@/lib/meta/engine';
import { useDecksQuery } from '@/lib/query/useDecksQuery';

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
        <Button onClick={() => setSort('trending')} size="sm" variant={sort === 'trending' ? 'primary' : 'secondary'}>
          Trending
        </Button>
        <Button onClick={() => setSort('winRate')} size="sm" variant={sort === 'winRate' ? 'primary' : 'secondary'}>
          Win Rate
        </Button>
        <Button onClick={() => setSort('mostViewed')} size="sm" variant={sort === 'mostViewed' ? 'primary' : 'secondary'}>
          Most Viewed
        </Button>
        <span className="ml-auto text-xs text-steel-600">{isFetching ? 'Refreshing deck index...' : `${visibleDecks.length} decks`}</span>
        <Link href="/decks/new" className="ml-4">
          <Button size="sm" variant="primary">+ Create Deck</Button>
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleDecks.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center gap-4 py-16 text-center">
            <p className="font-mono text-[11px] uppercase tracking-widest text-steel-500">No results</p>
            <h2 className="text-xl font-semibold text-foreground">No decks found</h2>
            <p className="max-w-xs text-sm text-steel-600">Try a different sort or check back later as the community grows.</p>
            <Button size="sm" variant="secondary" onClick={() => setSort('trending')}>View Trending</Button>
          </div>
        ) : (
          <>
            {decks.length <= 5 && (
              <div className="col-span-full rounded-lg border border-cobalt-500/30 bg-surface/50 px-4 py-3 text-sm text-steel-500">
                Community decks coming soon — more shared builds will appear here as pilots submit their lists.
              </div>
            )}
            {visibleDecks.map((deck) => {
              const previewCard = getCard(deck.entries[0]?.cardId);
              return (
                <DeckPreviewCard
                  key={deck.id}
                  heroUrl={previewCard ? getCardImage(previewCard) : withBasePath('/hero-bg.png')}
                  title={deck.name}
                  subtitle={deck.archetype}
                  author={deck.owner || 'Unknown'}
                  views={deck.views || 0}
                  cardCount={deck.entries.reduce((sum, e) => sum + (e.qty || 0), 0)}
                  updatedAgo={'recently'}
                  colors={deck.colors || []}
                  tags={deck.archetype ? [deck.archetype] : []}
                  avatarUrl={undefined}
                  onClick={() => router.push(`/decks/${deck.id}`)}
                  onMenu={() => {}}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
